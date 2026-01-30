import { createConversation } from "@/app/actions";

export default function NewConversationPage() {
  return (
    <main className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Import</h2>
        <p className="mt-1 text-sm text-zinc-600">Paste a conversation. We’ll store it as a single searchable document.</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <form action={createConversation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-800">Title</label>
            <input
              name="title"
              required
              placeholder="e.g., Dental offer – Jan 30"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-800">Conversation text</label>
            <textarea
              name="content"
              required
              rows={16}
              placeholder="Paste the full conversation here…"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-2 text-xs text-zinc-500">V1 stores raw text. Later we can support structured imports.</p>
          </div>

          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800">
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
