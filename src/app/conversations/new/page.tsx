import { createConversation } from "@/app/actions";

export default function NewConversationPage() {
  return (
    <main className="space-y-6">
      <h2 className="text-lg font-semibold">Import conversation</h2>

      <form action={createConversation} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300">Title</label>
          <input
            name="title"
            required
            placeholder="e.g., Sales plan + AI clinic niche"
            className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300">Conversation text</label>
          <textarea
            name="content"
            required
            rows={16}
            placeholder="Paste the full conversation here…"
            className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600"
          />
          <p className="mt-2 text-xs text-zinc-500">
            V1 stores raw text. Later we can support structured imports (Telegram/WhatsApp exports).
          </p>
        </div>

        <button className="rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950">Save</button>
      </form>
    </main>
  );
}
