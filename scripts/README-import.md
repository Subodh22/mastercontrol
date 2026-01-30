# MasterControl — Auto-import Clawdbot webchat history

This imports Clawdbot session JSONL logs into the MasterControl Supabase database.

## 0) Create secrets file (AWS box)

```bash
sudo mkdir -p /home/ubuntu/.secrets
sudo chown ubuntu:ubuntu /home/ubuntu/.secrets
chmod 700 /home/ubuntu/.secrets

cat > /home/ubuntu/.secrets/mastercontrol.env <<'EOF'
SUPABASE_URL=https://eklveiyfyagvplggshhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
MASTERCONTROL_EMAIL=subodhmaharjan33@gmail.com
MASTERCONTROL_TIMEZONE=Australia/Melbourne
CLAWDBOT_SESSION_FILE=/home/ubuntu/.clawdbot/agents/main/sessions/b60e599c-d667-4377-ad48-c10c2a54aafd.jsonl
EOF

chmod 600 /home/ubuntu/.secrets/mastercontrol.env
```

## 1) Run importer manually

```bash
cd /home/ubuntu/clawd/mastercontrol
DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-clawdbot-session.mjs
```

## 2) Schedule (optional)

Run every 5 minutes:

```bash
crontab -e
```

Add:

```cron
*/5 * * * * cd /home/ubuntu/clawd/mastercontrol && DOTENV_CONFIG_PATH=/home/ubuntu/.secrets/mastercontrol.env node -r dotenv/config scripts/import-clawdbot-session.mjs >> /home/ubuntu/.secrets/mastercontrol-import.log 2>&1
```
