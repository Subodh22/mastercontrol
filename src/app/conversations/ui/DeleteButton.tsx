"use client";

import { useTransition } from "react";
import { deleteConversation } from "@/app/actions";

export default function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Delete this conversation?")) return;
        startTransition(async () => {
          await deleteConversation(id);
        });
      }}
      disabled={pending}
      className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
