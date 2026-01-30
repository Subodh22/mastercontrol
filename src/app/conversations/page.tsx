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
    <main className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full gap-2 sm:max-w-xl" action="/conversations" method="get">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search…"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50">
            Search
          </button>
        </form>

        <Link
          href="/conversations/new"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
        >
          New import
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {data?.length ? (
          <div className="divide-y divide-zinc-100">
            {data.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <Link href={`/conversations/${c.id}`} className="block truncate text-sm font-medium text-zinc-900 hover:underline">
                    {c.title}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <DeleteButton id={c.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <div className="text-sm text-zinc-700">No conversations yet.</div>
            <div className="mt-1 text-sm text-zinc-500">Click “New import” to add one.</div>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500">Search is simple text match for now. We can upgrade to full-text search later.</p>
    </main>
  );
}
