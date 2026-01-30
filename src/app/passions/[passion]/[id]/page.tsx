import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PassionTabs from "@/app/passions/ui/PassionTabs";
import DeleteNoteButton from "../../ui/DeleteNoteButton";

const LABEL: Record<string, string> = {
  real_estate: "Real Estate",
  sales: "Sales",
  content: "Content",
};

export default async function PassionNotePage({
  params,
}: {
  params: Promise<{ passion: string; id: string }>;
}) {
  const { passion, id } = await params;
  if (!LABEL[passion]) return notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("passion_notes")
    .select("id,title,content,created_at,updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return notFound();

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">{data.title}</h2>
          <div className="mt-1 text-xs text-zinc-500">
            {LABEL[passion]} · Updated {new Date(data.updated_at).toLocaleString()}
          </div>
        </div>
        <Link href={`/passions/${passion}`} className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back
        </Link>
      </div>

      <PassionTabs active={passion} />

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <pre className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-zinc-900">{data.content}</pre>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">Created {new Date(data.created_at).toLocaleString()}</div>
        <DeleteNoteButton id={data.id} passion={passion} />
      </div>
    </main>
  );
}
