import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./ui/DeleteButton";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const query = supabase
    .from("conversations")
    .select("id,title,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data, error } = q
    ? await query.ilike("content", `%${q}%`)
    : await query;

  if (error) {
    return <div className="text-red-400">Error: {error.message}</div>;
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Link
          href="/conversations/new"
          className="rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950"
        >
          Import
        </Link>
      </div>

      <form className="flex gap-2" action="/conversations" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search text…"
          className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600"
        />
        <button className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          Search
        </button>
      </form>

      <div className="divide-y divide-zinc-900 rounded-xl border border-zinc-800 bg-zinc-900/20">
        {data?.length ? (
          data.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/conversations/${c.id}`} className="block truncate text-zinc-100 hover:underline">
                  {c.title}
                </Link>
                <div className="mt-1 text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <DeleteButton id={c.id} />
            </div>
          ))
        ) : (
          <div className="p-6 text-sm text-zinc-400">No conversations yet. Click Import.</div>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Tip: search currently scans content only (simple). We can upgrade to full-text search later.
      </p>
    </main>
  );
}
