import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;
const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY;

const DAYS = Number(process.env.OPENAI_BILLING_DAYS || 60);

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");
if (!OPENAI_ADMIN_KEY) throw new Error("Missing OPENAI_ADMIN_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toAestDayFromUnixSeconds(sec) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date(sec * 1000));
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
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

async function fetchCostsPage({ startTime, endTime, page }) {
  // Official Usage Costs endpoint (requires admin key)
  // GET /v1/organization/costs?start_time=...&end_time=...&bucket_width=1d&limit=180&page=...
  const url = new URL("https://api.openai.com/v1/organization/costs");
  url.searchParams.set("start_time", String(startTime));
  url.searchParams.set("end_time", String(endTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", "180");
  if (page) url.searchParams.set("page", page);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI costs fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}

async function upsertDay(userId, day, costUsd) {
  const { data: existing, error: selErr } = await supabase
    .from("openai_billing_daily")
    .select("id")
    .eq("user_id", userId)
    .eq("day", day)
    .limit(1);
  if (selErr) throw selErr;

  if (existing && existing.length) {
    const { error: updErr } = await supabase
      .from("openai_billing_daily")
      .update({ cost_usd: costUsd })
      .eq("id", existing[0].id);
    if (updErr) throw updErr;
    return "updated";
  }

  const { error: insErr } = await supabase.from("openai_billing_daily").insert({
    user_id: userId,
    day,
    cost_usd: costUsd,
  });
  if (insErr) throw insErr;
  return "inserted";
}

async function main() {
  const userId = await findUserIdByEmail(TARGET_EMAIL);

  const endSec = Math.floor(Date.now() / 1000);
  const startSec = endSec - DAYS * 24 * 60 * 60;

  let page = null;
  let sawAny = false;

  while (true) {
    const json = await fetchCostsPage({ startTime: startSec, endTime: endSec, page });
    const buckets = Array.isArray(json.data) ? json.data : [];

    for (const b of buckets) {
      sawAny = true;
      const day = toAestDayFromUnixSeconds(b.start_time);
      const results = Array.isArray(b.results) ? b.results : [];
      const amount = results.reduce((sum, r) => sum + Number(r?.amount?.value ?? 0), 0);
      const costUsd = Number(amount.toFixed(6));

      const action = await upsertDay(userId, day, costUsd);
      console.log(`openai_billing_daily ${day}: ${action} ($${costUsd.toFixed(4)})`);
    }

    if (json.has_more && json.next_page) {
      page = json.next_page;
    } else {
      break;
    }
  }

  if (!sawAny) {
    console.log("No costs returned for this range.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
