import { createClient } from "@/lib/supabase/server";

export default async function OpenAIUsageCard() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("openai_usage_daily")
    .select("day,input_tokens,output_tokens,total_tokens,num_model_requests")
    .order("day", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500">Official OpenAI usage (last 30 days)</div>
        <div className="mt-2 text-sm text-zinc-600">Not configured yet.</div>
        <div className="mt-1 text-xs text-zinc-500">Run supabase/openai_usage.sql + AWS importer.</div>
        <div className="mt-2 text-xs text-red-600">{error.message}</div>
      </div>
    );
  }

  const totalTokens = (data ?? []).reduce((s, r) => s + Number(r.total_tokens ?? 0), 0);
  const totalReq = (data ?? []).reduce((s, r) => s + Number(r.num_model_requests ?? 0), 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-zinc-500">Official OpenAI usage (last 30 days)</div>
      <div className="mt-1 text-2xl font-semibold">{Intl.NumberFormat().format(totalTokens)} tokens</div>
      <div className="mt-1 text-sm text-zinc-600">{Intl.NumberFormat().format(totalReq)} requests</div>
      <div className="mt-2 text-xs text-zinc-500">Source: /v1/organization/usage/completions (UTC)</div>
    </div>
  );
}
