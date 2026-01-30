import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import OpenAIUsageCard from "./OpenAIUsageCard";
import OpenAICostCard from "./OpenAICostCard";
import OpenAICombinedTable from "./OpenAICombinedTable";

export default async function UsagePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usage_daily")
    .select("day,input_tokens,output_tokens,total_tokens,cost_usd")
    .order("day", { ascending: false })
    .limit(60);

  if (error) {
    return (
      <main className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Error: {error.message}</div>
        <div className="text-sm text-zinc-600">
          If this is your first time: run <code className="rounded bg-white px-1 py-0.5">supabase/usage.sql</code> in Supabase,
          then run the AWS importer script.
        </div>
      </main>
    );
  }

  const totalCost = (data ?? []).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const totalTokens = (data ?? []).reduce((s, r) => s + Number(r.total_tokens ?? 0), 0);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Usage</h2>
          <p className="mt-1 text-sm text-zinc-600">Daily OpenAI usage as recorded by Clawdbot session logs.</p>
        </div>
        <Link href="/tasks" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Ops Board
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <OpenAIUsageCard />
        <OpenAICostCard />
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 60 days cost</div>
          <div className="mt-1 text-2xl font-semibold">${totalCost.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 60 days tokens</div>
          <div className="mt-1 text-2xl font-semibold">{Intl.NumberFormat().format(totalTokens)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Data source</div>
          <div className="mt-2 text-sm text-zinc-700">AWS → importer → Supabase</div>
        </div>
      </div>

      <OpenAICombinedTable />

      <div className="text-xs text-zinc-500">
        “Official OpenAI (daily)” is built from the OpenAI Usage API (tokens/requests) + OpenAI Costs API (spend) and joined by UTC day.
      </div>
    </main>
  );
}
