import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.from("conversations").select("id,title,content,created_at").eq("id", id).single();
  if (error || !data) return notFound();

  return (
    <main className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">{data.title}</h2>
          <div className="mt-1 text-xs text-zinc-500">{new Date(data.created_at).toLocaleString()}</div>
        </div>
        <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/conversations">
          ← Back
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <pre className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-zinc-900">{data.content}</pre>
      </div>
    </main>
  );
}
