# MasterControl — Usage import

Shows OpenAI usage/cost as recorded in Clawdbot session logs.

## 1) Create table
Run in Supabase SQL editor:
- `supabase/usage.sql`

## 2) Run importer on AWS

```bash
cd /home/ubuntu/clawd/mastercontrol
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-usage.mjs
```

## 3) Schedule (recommended: hourly)

```bash
crontab -e
```

Add:

```cron
0 * * * * cd /home/ubuntu/clawd/mastercontrol && DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-usage.mjs >> /home/ubuntu/.secrets/mastercontrol-usage.log 2>&1
```

View logs:

```bash
tail -n 100 /home/ubuntu/.secrets/mastercontrol-usage.log
```
