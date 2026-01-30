# MasterControl — Official OpenAI Usage import

This uses the OpenAI Usage API (admin key) to fetch daily usage and store it in Supabase.

## 1) Create table
Run in Supabase SQL editor:
- `supabase/openai_usage.sql`

## 2) Run importer on AWS

```bash
cd /home/ubuntu/clawd/mastercontrol
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-openai-usage.mjs
```

## 3) Schedule (hourly or daily)
Hourly:

```cron
0 * * * * cd /home/ubuntu/clawd/mastercontrol && DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-openai-usage.mjs >> /home/ubuntu/.secrets/mastercontrol-openai-usage.log 2>&1
```
