import { signOut } from "@/app/actions";

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <p className="mt-1 text-sm text-zinc-600">Your searchable vault of chats and notes.</p>
        </div>
        <form action={signOut}>
          <button className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
