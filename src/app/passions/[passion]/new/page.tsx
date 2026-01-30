import Link from "next/link";
import { notFound } from "next/navigation";
import PassionTabs from "@/app/passions/ui/PassionTabs";
import { createPassionNote } from "../actions";

const LABEL: Record<string, string> = {
  real_estate: "Real Estate",
  sales: "Sales",
  content: "Content",
};

export default async function NewPassionNotePage({ params }: { params: Promise<{ passion: string }> }) {
  const { passion } = await params;
  if (!LABEL[passion]) return notFound();

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">New note</h2>
          <p className="mt-1 text-sm text-zinc-600">{LABEL[passion]} · Notion-style</p>
        </div>
        <Link href={`/passions/${passion}`} className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back
        </Link>
      </div>

      <PassionTabs active={passion} />

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <form action={createPassionNote} className="space-y-4">
          <input type="hidden" name="passion" value={passion} />

          <div>
            <label className="block text-sm font-medium text-zinc-800">Title</label>
            <input
              name="title"
              required
              placeholder={`e.g., ${LABEL[passion]} ideas – Jan 30`}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-800">Content</label>
            <textarea
              name="content"
              rows={14}
              placeholder="Write your notes…"
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800">
            Create
          </button>
        </form>
      </div>
    </main>
  );
}
