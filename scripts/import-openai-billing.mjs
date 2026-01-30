import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;
const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const DAYS = Number(process.env.OPENAI_BILLING_DAYS || 60);

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");
if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY");

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

async function fetchBillingUsage(startDate, endDate) {
  // Legacy OpenAI billing endpoint (works for many accounts):
  // GET /v1/dashboard/billing/usage?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  const url = new URL("https://api.openai.com/v1/dashboard/billing/usage");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI billing usage fetch failed: ${res.status} ${res.statusText} ${text}`);
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

  const end = new Date();
  const start = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const startDate = toISODate(start);
  const endDate = toISODate(end);

  const json = await fetchBillingUsage(startDate, endDate);

  // json.total_usage is usually in cents.
  // json.daily_costs: [{ timestamp, line_items: [{ name, cost }] }]
  const dailyCosts = Array.isArray(json.daily_costs) ? json.daily_costs : [];

  if (!dailyCosts.length) {
    console.log("No daily_costs returned. Your account may require different usage endpoint.");
    console.log(JSON.stringify(json).slice(0, 1000));
    return;
  }

  for (const dayObj of dailyCosts) {
    const ts = dayObj.timestamp;
    const day = toAestDayFromUnixSeconds(ts);
    const lineItems = Array.isArray(dayObj.line_items) ? dayObj.line_items : [];
    const costCents = lineItems.reduce((sum, li) => sum + Number(li.cost || 0), 0);
    const costUsd = Number((costCents / 100).toFixed(6));

    const action = await upsertDay(userId, day, costUsd);
    console.log(`openai_billing_daily ${day}: ${action} ($${costUsd.toFixed(4)})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
