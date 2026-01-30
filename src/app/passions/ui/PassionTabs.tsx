import Link from "next/link";

const TABS = [
  { slug: "real_estate", label: "Real Estate" },
  { slug: "sales", label: "Sales" },
  { slug: "content", label: "Content" },
] as const;

export default function PassionTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const isActive = t.slug === active;
        return (
          <Link
            key={t.slug}
            href={`/passions/${t.slug}`}
            className={
              isActive
                ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm"
                : "rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
