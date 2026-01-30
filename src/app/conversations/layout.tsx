import Link from "next/link";
import { signOut } from "@/app/actions";

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link className="text-zinc-200 hover:text-white" href="/conversations">
            Conversations
          </Link>
          <Link className="text-zinc-200 hover:text-white" href="/conversations/new">
            Import
          </Link>
        </div>
        <form action={signOut}>
          <button className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900">
            Sign out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
