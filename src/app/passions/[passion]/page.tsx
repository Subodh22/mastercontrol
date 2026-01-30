import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PassionTabs from "@/app/passions/ui/PassionTabs";

const LABEL: Record<string, string> = {
  real_estate: "Real Estate",
  sales: "Sales",
  content: "Content",
};

export default async function PassionListPage({ params }: { params: Promise<{ passion: string }> }) {
  const { passion } = await params;
  if (!LABEL[passion]) return notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("passion_notes")
    .select("id,title,updated_at")
    .eq("passion", passion)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <main className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {error.message}</div>
        <div className="text-sm text-zinc-600">
          First time? Run <code className="rounded bg-white px-1 py-0.5">supabase/passions.sql</code> in Supabase.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Passions</h2>
          <p className="mt-1 text-sm text-zinc-600">Notion-style notes, grouped by focus area.</p>
        </div>
        <Link href="/tasks" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Ops Board
        </Link>
      </div>

      <PassionTabs active={passion} />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">{LABEL[passion]} notes</div>
        <Link
          href={`/passions/${passion}/new`}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
        >
          New note
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {data?.length ? (
          <div className="divide-y divide-zinc-100">
            {data.map((n) => (
              <Link
                key={n.id}
                href={`/passions/${passion}/${n.id}`}
                className="block px-4 py-3 hover:bg-zinc-50"
              >
                <div className="text-sm font-medium text-zinc-900">{n.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{new Date(n.updated_at).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <div className="text-sm text-zinc-700">No notes yet.</div>
            <div className="mt-1 text-sm text-zinc-500">Create your first note for {LABEL[passion]}.</div>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500">Tabs: Real Estate · Sales · Content</div>
    </main>
  );
}
