import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;
const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";
const SESSIONS_DIR = process.env.CLAWDBOT_SESSIONS_DIR || "/home/ubuntu/.clawdbot/agents/main/sessions";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toAestDay(iso) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date(iso)); // YYYY-MM-DD
}

async function findUserIdByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (users.length < perPage) break;
    page += 1;
  }
  throw new Error(`Could not find Supabase user for email: ${email}`);
}

function safeNum(x) {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function extractUsage(obj) {
  // We rely on Clawdbot's stored message usage field.
  // Example: obj.message.usage: { input, output, totalTokens, cost: { total } }
  const usage = obj?.message?.usage;
  if (!usage) return null;
  const input = safeNum(usage.input ?? usage.input_tokens ?? 0);
  const output = safeNum(usage.output ?? usage.output_tokens ?? 0);
  const total = safeNum(usage.totalTokens ?? usage.total_tokens ?? input + output);
  const cost = safeNum(usage.cost?.total ?? usage.cost_usd ?? 0);
  return { input, output, total, cost };
}

async function upsertDaily({ userId, day, agg }) {
  const { data: existing, error: selErr } = await supabase
    .from("usage_daily")
    .select("id")
    .eq("user_id", userId)
    .eq("day", day)
    .limit(1);
  if (selErr) throw selErr;

  if (existing && existing.length) {
    const id = existing[0].id;
    const { error: updErr } = await supabase
      .from("usage_daily")
      .update({
        input_tokens: Math.round(agg.input),
        output_tokens: Math.round(agg.output),
        total_tokens: Math.round(agg.total),
        cost_usd: agg.cost,
      })
      .eq("id", id);
    if (updErr) throw updErr;
    return { action: "updated" };
  }

  const { error: insErr } = await supabase.from("usage_daily").insert({
    user_id: userId,
    day,
    input_tokens: Math.round(agg.input),
    output_tokens: Math.round(agg.output),
    total_tokens: Math.round(agg.total),
    cost_usd: agg.cost,
  });
  if (insErr) throw insErr;
  return { action: "inserted" };
}

async function main() {
  const userId = await findUserIdByEmail(TARGET_EMAIL);

  if (!fs.existsSync(SESSIONS_DIR)) throw new Error(`Sessions dir not found: ${SESSIONS_DIR}`);

  const files = fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(SESSIONS_DIR, f));

  const daily = new Map();

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (obj?.type !== "message") continue;
      const ts = obj.timestamp || obj?.message?.timestamp;
      if (!ts) continue;

      const u = extractUsage(obj);
      if (!u) continue;

      const day = toAestDay(ts);
      const prev = daily.get(day) || { input: 0, output: 0, total: 0, cost: 0 };
      prev.input += u.input;
      prev.output += u.output;
      prev.total += u.total;
      prev.cost += u.cost;
      daily.set(day, prev);
    }
  }

  const days = Array.from(daily.keys()).sort();
  if (!days.length) {
    console.log("No usage found in session logs yet.");
    return;
  }

  for (const day of days) {
    const agg = daily.get(day);
    const res = await upsertDaily({ userId, day, agg });
    console.log(`usage_daily ${day}: ${res.action} (tokens=${Math.round(agg.total)}, cost=$${agg.cost.toFixed(4)})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
