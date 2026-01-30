import { createClient } from "@/lib/supabase/server";

export default async function OpenAICombinedTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("openai_usage_combined_daily")
    .select("day,input_tokens,output_tokens,total_tokens,num_model_requests,cost_usd")
    .order("day", { ascending: false })
    .limit(31);

  if (error) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-zinc-900">Official OpenAI (daily)</div>
        <div className="mt-2 text-sm text-zinc-600">Create the combined view in Supabase:</div>
        <div className="mt-2 rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-700">supabase/openai_usage_combined_view.sql</div>
        <div className="mt-2 text-xs text-red-600">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900">Official OpenAI (daily)</div>
      <div className="grid grid-cols-6 gap-2 border-b border-zinc-100 bg-white px-4 py-2 text-xs font-medium text-zinc-600">
        <div>Date (UTC)</div>
        <div className="text-right">Input</div>
        <div className="text-right">Output</div>
        <div className="text-right">Total</div>
        <div className="text-right">Requests</div>
        <div className="text-right">Cost</div>
      </div>
      <div className="divide-y divide-zinc-100">
        {(data ?? []).map((r) => (
          <div key={r.day} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm">
            <div className="text-zinc-900">{r.day}</div>
            <div className="text-right text-zinc-700">{Intl.NumberFormat().format(Number(r.input_tokens ?? 0))}</div>
            <div className="text-right text-zinc-700">{Intl.NumberFormat().format(Number(r.output_tokens ?? 0))}</div>
            <div className="text-right font-medium text-zinc-900">{Intl.NumberFormat().format(Number(r.total_tokens ?? 0))}</div>
            <div className="text-right text-zinc-700">{Intl.NumberFormat().format(Number(r.num_model_requests ?? 0))}</div>
            <div className="text-right text-zinc-700">${Number(r.cost_usd ?? 0).toFixed(4)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
