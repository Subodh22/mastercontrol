import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // optional (if set, we generate better angles)

const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";
const LIMIT = Number(process.env.VIRAL_IDEAS_LIMIT || 20);

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function stampDayAest() {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date());
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

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "mastercontrol-viral-ideas/1.0",
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "mastercontrol-viral-ideas/1.0" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

async function fetchRss(url) {
  const xml = await fetchText(url);
  const parser = new XMLParser({ ignoreAttributes: false });
  return parser.parse(xml);
}

function isAiRelated(s) {
  const t = (s || "").toLowerCase();
  return [
    "ai",
    "artificial intelligence",
    "llm",
    "gpt",
    "openai",
    "claude",
    "gemini",
    "agent",
    "agents",
    "automation",
    "workflow",
    "copilot",
    "rag",
    "vector",
    "prompt",
    "deepfake",
    "voice",
    "speech",
    "video",
    "multimodal",
    "inference",
  ].some((k) => t.includes(k));
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function sourceHackerNews() {
  // Use Algolia HN API for top stories.
  const json = await fetchJson("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=50");
  const hits = json.hits || [];
  return hits
    .map((h) => ({
      topic: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "Hacker News",
      score: h.points || 0,
      comments: h.num_comments || 0,
    }))
    .filter((x) => isAiRelated(x.topic));
}

async function sourceReddit() {
  // Reddit JSON is frequently blocked (403). Use RSS instead.
  const subs = ["artificial", "MachineLearning", "OpenAI", "singularity", "Entrepreneur", "SaaS"];
  const out = [];
  for (const sub of subs) {
    const rss = await fetchRss(`https://www.reddit.com/r/${sub}/hot/.rss`);
    const items = rss?.feed?.entry;
    const list = Array.isArray(items) ? items : items ? [items] : [];
    for (const it of list.slice(0, 25)) {
      const title = it?.title;
      const link = it?.link?.[0]?.["@_href"] || it?.link?.["@_href"];
      if (!title || !link) continue;
      if (!isAiRelated(title)) continue;
      out.push({
        topic: title,
        url: link,
        source: `Reddit r/${sub}`,
        score: 0,
      });
    }
  }
  return out;
}

async function sourceGoogleTrends() {
  // RSS endpoint can change; try a couple common variants.
  const urls = [
    "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US",
    "https://trends.google.com/trends/trendingsearches/daily?geo=US&format=rss",
  ];

  for (const url of urls) {
    try {
      const rss = await fetchRss(url);
      const items = rss?.rss?.channel?.item;
      const list = Array.isArray(items) ? items : items ? [items] : [];
      const out = list
        .map((it) => ({
          topic: it.title,
          url: it.link,
          source: "Google Trends (US daily)",
          score: 0,
        }))
        .filter((x) => isAiRelated(x.topic));
      if (out.length) return out;
    } catch {
      // try next
    }
  }

  return [];
}

async function sourceProductHunt() {
  // No stable public API; use their RSS for "AI" tag sometimes is blocked.
  // We'll use a generic RSS feed of the day.
  const rss = await fetchRss("https://www.producthunt.com/feed");
  const items = rss?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return list
    .slice(0, 50)
    .map((it) => ({
      topic: it.title,
      url: it.link,
      source: "Product Hunt",
      score: 0,
    }))
    .filter((x) => isAiRelated(x.topic));
}

async function generateAnglesWithOpenAI(items) {
  if (!OPENAI_API_KEY) return items;

  // Keep it cheap: one request for all items.
  const prompt = `You are helping a creator generate daily viral content ideas about AI and practical implementation.
For each topic below, return JSON array of objects with fields:
- hook: 1 short punchy hook line for a YouTube Short (<= 12 words)
- why_now: 1 sentence why this topic is trending/important
- implementation_angles: 3 bullet points (as strings) of high-ROI business use cases

Topics:\n${items.map((x, i) => `${i + 1}. ${x.topic}`).join("\n")}`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: prompt,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("OpenAI enrichment failed:", res.status, text);
    return items;
  }

  const json = await res.json();
  const text = json.output_text || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // fallback: no enrichment
    return items;
  }

  if (!Array.isArray(parsed)) return items;

  return items.map((it, idx) => ({
    ...it,
    hook: parsed[idx]?.hook,
    why_now: parsed[idx]?.why_now,
    angles: parsed[idx]?.implementation_angles,
  }));
}

function formatDaily(items, day) {
  const lines = [];
  lines.push(`Viral Ideas — ${day} (${TIMEZONE})`);
  lines.push("");
  lines.push(`Sources: Hacker News, Reddit, Google Trends, Product Hunt (AI-filtered).`);
  lines.push("");

  items.forEach((it, i) => {
    lines.push(`${i + 1}) ${it.topic}`);
    if (it.source === "Hacker News") {
      lines.push(`   Score: ${it.score ?? 0} points · ${it.comments ?? 0} comments`);
    } else if (typeof it.score === "number" && it.score > 0) {
      lines.push(`   Score: ${it.score}`);
    }
    if (it.hook) lines.push(`   Hook: ${it.hook}`);
    if (it.why_now) lines.push(`   Why now: ${it.why_now}`);
    if (Array.isArray(it.angles) && it.angles.length) {
      lines.push(`   Implementation angles:`);
      for (const a of it.angles) lines.push(`   - ${a}`);
    }
    lines.push(`   Source: ${it.source}`);
    lines.push(`   Link: ${it.url}`);
    lines.push("");
  });

  return lines.join("\n");
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
    const { error: updErr } = await supabase.from("conversations").update({ content }).eq("id", existing[0].id);
    if (updErr) throw updErr;
    return { action: "updated" };
  }

  const { error: insErr } = await supabase.from("conversations").insert({ user_id: userId, title, content });
  if (insErr) throw insErr;
  return { action: "inserted" };
}

async function main() {
  const userId = await findUserIdByEmail(TARGET_EMAIL);
  const day = stampDayAest();
  const title = `Viral Ideas — ${day}`;

  const sources = await Promise.allSettled([
    sourceHackerNews(),
    sourceReddit(),
    sourceGoogleTrends(),
    sourceProductHunt(),
  ]);

  let items = [];
  for (const r of sources) {
    if (r.status === "fulfilled") items.push(...r.value);
    else console.warn("source failed:", r.reason?.message || r.reason);
  }

  items = uniqBy(items, (x) => `${x.topic}::${x.url}`);
  items.sort((a, b) => (b.score || 0) - (a.score || 0));
  items = items.slice(0, LIMIT);

  items = await generateAnglesWithOpenAI(items);

  const content = formatDaily(items, day);
  const res = await upsertConversation({ userId, title, content });
  console.log(`${title}: ${res.action} (${items.length} ideas)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
