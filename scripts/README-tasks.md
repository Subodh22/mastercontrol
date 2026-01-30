# MasterControl — Ops Board task logger

This lets the AWS box update your MasterControl Ops Board (Kanban) while Jarvis is working.

## Prereqs
- Supabase schema applied: `supabase/tasks.sql`
- Secrets file exists: `/home/ubuntu/.secrets/mastercontrol.env`
  - includes `SUPABASE_SERVICE_ROLE_KEY` and `MASTERCONTROL_EMAIL`

## Usage

```bash
cd /home/ubuntu/clawd/mastercontrol

# Create a task (prints task id)
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/task.mjs create \
  --title "Build feature X" \
  --desc "Context" \
  --status doing

# Append a progress log line
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/task.mjs log \
  --id <TASK_ID> \
  --text "Implemented DB schema"

# Move status
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/task.mjs status \
  --id <TASK_ID> \
  --status blocked

# Mark done + write final result
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/task.mjs done \
  --id <TASK_ID> \
  --result "Deployed to Vercel"
```
