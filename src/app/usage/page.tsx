import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import OpenAICostCard from "./OpenAICostCard";

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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-5 gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
          <div>Date</div>
          <div className="text-right">Input</div>
          <div className="text-right">Output</div>
          <div className="text-right">Total</div>
          <div className="text-right">Cost (USD)</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {(data ?? []).map((r) => (
            <div key={r.day} className="grid grid-cols-5 gap-2 px-4 py-2 text-sm">
              <div className="text-zinc-900">{r.day}</div>
              <div className="text-right text-zinc-700">{Intl.NumberFormat().format(Number(r.input_tokens ?? 0))}</div>
              <div className="text-right text-zinc-700">{Intl.NumberFormat().format(Number(r.output_tokens ?? 0))}</div>
              <div className="text-right font-medium text-zinc-900">{Intl.NumberFormat().format(Number(r.total_tokens ?? 0))}</div>
              <div className="text-right text-zinc-700">${Number(r.cost_usd ?? 0).toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Note: this reflects Clawdbot session log usage fields. If you want official OpenAI billing usage, we can integrate the
        OpenAI Usage API separately.
      </div>
    </main>
  );
}
