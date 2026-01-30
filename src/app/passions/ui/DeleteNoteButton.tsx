"use client";

import { useTransition } from "react";
import { deletePassionNote } from "../[passion]/actions";

export default function DeleteNoteButton({ id, passion }: { id: string; passion: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this note?") ) return;
        startTransition(async () => {
          await deletePassionNote(id, passion);
        });
      }}
      className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
