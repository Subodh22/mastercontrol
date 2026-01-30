import { createClient } from "@/lib/supabase/server";

export default async function OpenAICostCard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("openai_billing_daily")
    .select("day,cost_usd")
    .order("day", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500">Official OpenAI billing</div>
        <div className="mt-2 text-sm text-zinc-600">Not configured yet.</div>
        <div className="mt-1 text-xs text-zinc-500">Run supabase/openai_billing.sql + AWS importer.</div>
        <div className="mt-2 text-xs text-red-600">{error.message}</div>
      </div>
    );
  }

  const total = (data ?? []).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-zinc-500">Official OpenAI billing (last 30 days)</div>
      <div className="mt-1 text-2xl font-semibold">${total.toFixed(2)}</div>
      <div className="mt-2 text-xs text-zinc-500">Source: OpenAI billing usage API → AWS → Supabase</div>
    </div>
  );
}
