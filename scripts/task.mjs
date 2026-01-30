import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.MASTERCONTROL_EMAIL;
const TIMEZONE = process.env.MASTERCONTROL_TIMEZONE || "Australia/Melbourne";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!TARGET_EMAIL) throw new Error("Missing MASTERCONTROL_EMAIL");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ORDER = ["backlog", "todo", "doing", "blocked", "done"];

function nowStamp() {
  const dtf = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

function usage() {
  console.log(`
MasterControl task helper

Commands:
  create --title "..." [--desc "..."] [--status backlog|todo|doing|blocked|done]
  status --id <uuid> --status backlog|todo|doing|blocked|done
  log --id <uuid> --text "..."
  done --id <uuid> --result "..."   (also sets status=done)

Env (load via dotenv):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  MASTERCONTROL_EMAIL
  MASTERCONTROL_TIMEZONE (optional, default Australia/Melbourne)
`);
}

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) return usage();

  const userId = await findUserIdByEmail(TARGET_EMAIL);

  if (cmd === "create") {
    const title = arg("--title");
    const desc = arg("--desc");
    const status = arg("--status") || "backlog";
    if (!title) throw new Error("Missing --title");
    if (!ORDER.includes(status)) throw new Error(`Invalid --status: ${status}`);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        description: desc ?? null,
        status,
        result: `${nowStamp()} — created\n`,
      })
      .select("id")
      .single();
    if (error) throw error;
    console.log(data.id);
    return;
  }

  if (cmd === "status") {
    const id = arg("--id");
    const status = arg("--status");
    if (!id) throw new Error("Missing --id");
    if (!status) throw new Error("Missing --status");
    if (!ORDER.includes(status)) throw new Error(`Invalid --status: ${status}`);

    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) throw error;
    console.log("ok");
    return;
  }

  if (cmd === "log") {
    const id = arg("--id");
    const text = arg("--text");
    if (!id) throw new Error("Missing --id");
    if (!text) throw new Error("Missing --text");

    const { data: row, error: selErr } = await supabase.from("tasks").select("result").eq("id", id).single();
    if (selErr) throw selErr;

    const prev = row?.result ?? "";
    const next = `${prev}${prev.endsWith("\n") || prev.length === 0 ? "" : "\n"}${nowStamp()} — ${text}\n`;

    const { error } = await supabase.from("tasks").update({ result: next }).eq("id", id);
    if (error) throw error;
    console.log("ok");
    return;
  }

  if (cmd === "done") {
    const id = arg("--id");
    const result = arg("--result");
    if (!id) throw new Error("Missing --id");
    if (!result) throw new Error("Missing --result");

    const { data: row, error: selErr } = await supabase.from("tasks").select("result").eq("id", id).single();
    if (selErr) throw selErr;
    const prev = row?.result ?? "";
    const next = `${prev}${prev.endsWith("\n") || prev.length === 0 ? "" : "\n"}${nowStamp()} — DONE: ${result}\n`;

    const { error } = await supabase.from("tasks").update({ status: "done", result: next }).eq("id", id);
    if (error) throw error;
    console.log("ok");
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
