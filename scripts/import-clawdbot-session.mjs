import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERC_CONTROL_EMAIL || process.env.MASTERCONTROL_EMAIL;
const SESSION_FILE = process.env.CLAWDBOT_SESSION_FILE || "/home/ubuntu/.clawdbot/agents/main/sessions/b60e599c-d667-4377-ad48-c10c2a54aafd.jsonl";
const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL (set to your login email)");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toAestDate(iso) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date(iso)); // YYYY-MM-DD
}

function toAestTime(iso) {
  const dtf = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return dtf.format(new Date(iso));
}

function extractText(message) {
  // message.content is an array of parts; keep only plain text chunks
  const parts = message?.content;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
}

async function findUserIdByEmail(email) {
  // Supabase Admin API: listUsers is paginated.
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

async function upsertConversation({ userId, title, content }) {
  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .limit(1);

  if (selErr) throw selErr;

  if (existing && existing.length) {
    const id = existing[0].id;
    const { error: updErr } = await supabase.from("conversations").update({ content }).eq("id", id);
    if (updErr) throw updErr;
    return { action: "updated", id };
  }

  const { data: ins, error: insErr } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title, content })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return { action: "inserted", id: ins.id };
}

async function main() {
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error(`Session file not found: ${SESSION_FILE}`);
  }

  const userId = await findUserIdByEmail(TARGET_EMAIL);

  const lines = fs.readFileSync(SESSION_FILE, "utf8").split(/\r?\n/).filter(Boolean);

  const buckets = new Map();

  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    if (obj?.type !== "message") continue;
    const msg = obj?.message;
    const role = msg?.role;
    if (role !== "user" && role !== "assistant") continue;

    const text = extractText(msg);
    if (!text) continue;

    const ts = obj.timestamp || msg.timestamp;
    if (!ts) continue;

    const date = toAestDate(ts);
    const time = toAestTime(ts);

    const entry = `[${time}] ${role.toUpperCase()}: ${text}`;
    if (!buckets.has(date)) buckets.set(date, []);
    buckets.get(date).push(entry);
  }

  // Upsert each day
  const dates = Array.from(buckets.keys()).sort();
  if (!dates.length) {
    console.log("No messages found to import.");
    return;
  }

  for (const date of dates) {
    const title = `Clawdbot Chat — ${date}`;
    const content = buckets.get(date).join("\n\n");
    const res = await upsertConversation({ userId, title, content });
    console.log(`${title}: ${res.action}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
