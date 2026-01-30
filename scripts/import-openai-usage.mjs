import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY;

const DAYS = Number(process.env.OPENAI_USAGE_DAYS || 60);

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");
if (!OPENAI_ADMIN_KEY) throw new Error("Missing OPENAI_ADMIN_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function utcDay(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 10);
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

async function fetchUsageCompletionsPage({ startTime, endTime, page }) {
  const url = new URL("https://api.openai.com/v1/organization/usage/completions");
  url.searchParams.set("start_time", String(startTime));
  url.searchParams.set("end_time", String(endTime));
  url.searchParams.set("bucket_width", "1d");
  // For bucket_width=1d, OpenAI caps limit at 31.
  url.searchParams.set("limit", "31");
  if (page) url.searchParams.set("page", page);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI usage fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}

async function upsertDay(userId, day, agg) {
  const { data: existing, error: selErr } = await supabase
    .from("openai_usage_daily")
    .select("id")
    .eq("user_id", userId)
    .eq("day", day)
    .limit(1);
  if (selErr) throw selErr;

  const payload = {
    input_tokens: Math.round(agg.input_tokens),
    output_tokens: Math.round(agg.output_tokens),
    total_tokens: Math.round(agg.total_tokens),
    num_model_requests: Math.round(agg.num_model_requests),
  };

  if (existing && existing.length) {
    const { error: updErr } = await supabase.from("openai_usage_daily").update(payload).eq("id", existing[0].id);
    if (updErr) throw updErr;
    return "updated";
  }

  const { error: insErr } = await supabase.from("openai_usage_daily").insert({ user_id: userId, day, ...payload });
  if (insErr) throw insErr;
  return "inserted";
}

async function main() {
  const userId = await findUserIdByEmail(TARGET_EMAIL);

  const nowSec = Math.floor(Date.now() / 1000);
  const rangeStart = nowSec - DAYS * 24 * 60 * 60;

  // The API limits bucket_width=1d to max 31 buckets per call.
  const windowSec = 31 * 24 * 60 * 60;

  let sawAny = false;

  for (let start = rangeStart; start < nowSec; start += windowSec) {
    const end = Math.min(start + windowSec, nowSec);

    let page = null;
    while (true) {
      const json = await fetchUsageCompletionsPage({ startTime: start, endTime: end, page });
      const buckets = Array.isArray(json.data) ? json.data : [];

      for (const b of buckets) {
        sawAny = true;
        const day = utcDay(b.start_time);
        const results = Array.isArray(b.results) ? b.results : [];

        // If not grouped, results should have one record. If grouped, sum them.
        const agg = results.reduce(
          (acc, r) => {
            acc.input_tokens += Number(r.input_tokens ?? 0);
            acc.output_tokens += Number(r.output_tokens ?? 0);
            acc.total_tokens += Number(r.input_tokens ?? 0) + Number(r.output_tokens ?? 0);
            acc.num_model_requests += Number(r.num_model_requests ?? 0);
            return acc;
          },
          { input_tokens: 0, output_tokens: 0, total_tokens: 0, num_model_requests: 0 }
        );

        const action = await upsertDay(userId, day, agg);
        console.log(
          `openai_usage_daily ${day}: ${action} (in=${agg.input_tokens}, out=${agg.output_tokens}, req=${agg.num_model_requests})`
        );
      }

      if (json.has_more && json.next_page) page = json.next_page;
      else break;
    }
  }

  if (!sawAny) console.log("No usage buckets returned for this range.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
