-- Combined daily view: official OpenAI usage + costs by UTC day

create or replace view public.openai_usage_combined_daily as
select
  u.user_id,
  u.day,
  u.input_tokens,
  u.output_tokens,
  u.total_tokens,
  u.num_model_requests,
  coalesce(c.cost_usd, 0) as cost_usd
from public.openai_usage_daily u
left join public.openai_billing_daily c
  on c.user_id = u.user_id and c.day = u.day;

-- RLS policies do not apply to views directly; access is controlled by underlying tables.
