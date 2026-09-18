import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabase, STORAGE_BUCKET } from '@/lib/supabase';

const settingsPath = path.join(process.cwd(), 'data', 'notifications.json');
const remotePath = 'settings/notifications.json';

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function clean(emails: string[]): string[] {
  return emails
    .map((e) => String(e).trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}

function envDefaults(): string[] {
  const env = process.env.ADMIN_EMAIL;
  return env ? clean(env.split(',')) : [];
}

export async function getOrderNotificationEmails(): Promise<string[]> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabase().storage.from(STORAGE_BUCKET).download(remotePath);
      if (!error && data) {
        const parsed = JSON.parse(await data.text()) as { emails?: string[] };
        if (Array.isArray(parsed.emails)) {
          const cleaned = clean(parsed.emails);
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {
      // el objeto remoto todavía no existe
    }
  }
  try {
    const raw = await readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as { emails?: string[] };
    if (Array.isArray(parsed.emails)) {
      const cleaned = clean(parsed.emails);
      if (cleaned.length > 0) return cleaned;
    }
  } catch {
    // el archivo local todavía no existe
  }
  return envDefaults();
}

export async function setOrderNotificationEmails(emails: string[]): Promise<string[]> {
  const cleaned = clean(emails);
  if (hasSupabaseConfig()) {
    const { error } = await getSupabase().storage.from(STORAGE_BUCKET).upload(
      remotePath,
      JSON.stringify({ emails: cleaned }),
      { upsert: true, contentType: 'application/json', cacheControl: '0' },
    );
    if (error) throw new Error(error.message);
    return cleaned;
  }
  const temporaryPath = `${settingsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify({ emails: cleaned }, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, settingsPath);
  return cleaned;
}
