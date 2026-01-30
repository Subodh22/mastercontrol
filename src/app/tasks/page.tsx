import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import TaskCard from "./ui/TaskCard";
import NewTaskForm from "./ui/NewTaskForm";

const COLUMNS: Array<{ key: string; title: string; help: string }> = [
  { key: "backlog", title: "Backlog", help: "Captured tasks" },
  { key: "todo", title: "To do", help: "Next actions" },
  { key: "doing", title: "Doing", help: "In progress" },
  { key: "blocked", title: "Blocked", help: "Waiting on something" },
  { key: "done", title: "Done", help: "Completed" },
];

export default async function TasksPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,description,status,result,updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <main className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Tasks table not ready yet (or RLS blocked). Error: {error.message}
        </div>
        <div className="text-sm text-zinc-600">
          Run <code className="rounded bg-white px-1 py-0.5">supabase/tasks.sql</code> in Supabase SQL editor.
        </div>
      </main>
    );
  }

  const byStatus = new Map<string, typeof data>();
  for (const col of COLUMNS) byStatus.set(col.key, []);
  for (const t of data ?? []) {
    const arr = byStatus.get(t.status) ?? [];
    arr.push(t);
    byStatus.set(t.status, arr);
  }

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Operations Board</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Track what Jarvis is doing: tasks → progress → results.
          </p>
        </div>
        <Link
          href="/conversations"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Back to conversations
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <NewTaskForm />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => (
          <section key={col.key} className="space-y-2">
            <div className="px-1">
              <div className="text-sm font-semibold text-zinc-900">{col.title}</div>
              <div className="text-xs text-zinc-500">{col.help}</div>
            </div>
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 min-h-[120px]">
              {(byStatus.get(col.key) ?? []).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="text-xs text-zinc-500">
        Note: drag-and-drop isn’t enabled yet. Use the move buttons on each card.
      </div>
    </main>
  );
}
