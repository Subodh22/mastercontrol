"use client";

import { useState } from "react";

export default function NewTaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"backlog" | "todo" | "doing" | "blocked" | "done">("backlog");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/tasks/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle("");
      setDescription("");
      setStatus("backlog");
      setMsg("Saved.");
      window.location.reload();
    } catch (err: any) {
      setMsg(err?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="text-sm font-semibold text-zinc-900">Add task</div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-zinc-700">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Build HubSpot missed-call workflow"
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-700">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add context, links, requirements…"
          className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add"}
        </button>
        {msg && <div className="text-sm text-zinc-600">{msg}</div>}
      </div>
    </form>
  );
}
