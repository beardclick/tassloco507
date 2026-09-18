import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabase, STORAGE_BUCKET } from './supabase';
import { getAdmins, getSupabaseAuthUsers } from './db';

const prefsPath = path.join(process.cwd(), 'data', 'notification-prefs.json');
const remotePrefsPath = 'settings/notification-prefs.json';

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readDisabled(): Promise<string[]> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabase().storage.from(STORAGE_BUCKET).download(remotePrefsPath);
      if (!error && data) {
        const parsed = JSON.parse(await data.text()) as { disabled?: string[] };
        if (Array.isArray(parsed.disabled)) return parsed.disabled;
      }
    } catch {
      // aún no existe el objeto remoto
    }
  }
  try {
    const raw = await readFile(prefsPath, 'utf8');
    const parsed = JSON.parse(raw) as { disabled?: string[] };
    if (Array.isArray(parsed.disabled)) return parsed.disabled;
  } catch {
    // aún no existe el archivo local
  }
  return [];
}

async function writeDisabled(disabled: string[]): Promise<void> {
  const payload = JSON.stringify({ disabled });
  if (hasSupabaseConfig()) {
    const { error } = await getSupabase().storage.from(STORAGE_BUCKET).upload(
      remotePrefsPath,
      payload,
      { upsert: true, contentType: 'application/json', cacheControl: '0' },
    );
    if (error) throw new Error(error.message);
    return;
  }
  const tmp = `${prefsPath}.tmp`;
  await writeFile(tmp, `${payload}\n`, 'utf8');
  await rename(tmp, prefsPath);
}

/** Todos los correos de administradores (base de datos + Supabase Auth). */
export async function getAllAdminEmails(): Promise<string[]> {
  const set = new Set<string>();
  for (const a of await getAdmins()) {
    if (a.email) set.add(a.email.toLowerCase());
  }
  for (const u of await getSupabaseAuthUsers()) {
    if (u.email) set.add(u.email.toLowerCase());
  }
  return [...set];
}

export async function getDisabledNotificationEmails(): Promise<string[]> {
  return readDisabled();
}

export async function isNotificationDisabled(email: string): Promise<boolean> {
  const disabled = await readDisabled();
  return disabled.includes(email.toLowerCase());
}

export async function setNotificationDisabled(email: string, disabled: boolean): Promise<void> {
  const current = await readDisabled();
  const e = email.toLowerCase();
  const next = disabled ? [...new Set([...current, e])] : current.filter((x) => x !== e);
  await writeDisabled(next);
}

/** Correos que deben recibir la notificación de pedido (todos menos los desactivados). */
export async function getOrderNotificationEmails(): Promise<string[]> {
  const all = await getAllAdminEmails();
  const disabled = new Set(await readDisabled());
  return all.filter((e) => !disabled.has(e));
}
