"use client";

import { useTransition } from "react";

const ORDER = ["backlog", "todo", "doing", "blocked", "done"] as const;

export default function MoveButtons({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const idx = ORDER.indexOf(status as any);

  async function setStatus(next: string) {
    const res = await fetch("/tasks/api", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    if (!res.ok) throw new Error(await res.text());
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={pending || idx <= 0}
        onClick={() =>
          startTransition(async () => {
            await setStatus(ORDER[idx - 1]);
          })
        }
        className="rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
      >
        ←
      </button>
      <button
        type="button"
        disabled={pending || idx < 0 || idx >= ORDER.length - 1}
        onClick={() =>
          startTransition(async () => {
            await setStatus(ORDER[idx + 1]);
          })
        }
        className="rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
      >
        →
      </button>
    </div>
  );
}
