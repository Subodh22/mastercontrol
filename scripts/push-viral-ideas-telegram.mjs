import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

// This script prints the message to stdout.
// Sending happens via Clawdbot (cron-triggered agent) to comply with messaging policy.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.MASTERCONTROL_EMAIL;

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
if (!EMAIL) throw new Error('Missing MASTERCONTROL_EMAIL');

const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession:false, autoRefreshToken:false } });

async function findUserIdByEmail(email){
  let page=1; const perPage=200;
  while(true){
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const u=(data.users||[]).find(x => (x.email||'').toLowerCase()===email.toLowerCase());
    if (u) return u.id;
    if ((data.users||[]).length < perPage) break;
    page++;
  }
  throw new Error('user not found');
}

function parseItems(content){
  const lines = String(content||'').split('\n');
  const items=[];
  let cur=null;
  for(const line of lines){
    const m=line.match(/^(\d+)\)\s+(.*)$/);
    if(m){
      if(cur) items.push(cur);
      cur={n:Number(m[1]), title:m[2].trim(), scoreLine:null, link:null, source:null};
      continue;
    }
    if(!cur) continue;
    const l=line.trim();
    if(l.startsWith('Score:')) cur.scoreLine = l.replace(/^Score:\s*/, '').trim();
    if(l.startsWith('Link:')) cur.link = l.replace(/^Link:\s*/, '').trim();
    if(l.startsWith('Source:')) cur.source = l.replace(/^Source:\s*/, '').trim();
  }
  if(cur) items.push(cur);
  return items;
}

async function main(){
  const userId = await findUserIdByEmail(EMAIL);
  const { data, error } = await supabase
    .from('conversations')
    .select('title,content,created_at')
    .eq('user_id', userId)
    .like('title', 'Viral Ideas — %')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;

  const items = parseItems(data.content).slice(0,20);
  let msg = `${data.title} (Top 20 + metrics)\n\n`;
  for(const it of items){
    msg += `${it.n}) ${it.title}\n`;
    if(it.scoreLine) msg += `${it.scoreLine}\n`;
    msg += `Source: ${it.source||''}\n`;
    msg += `Link: ${it.link||''}\n\n`;
  }
  process.stdout.write(msg);
}

main().catch((e)=>{console.error(e); process.exit(1);});
