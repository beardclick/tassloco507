import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabase, PRIVATE_STORAGE_BUCKET } from '@/lib/supabase';

export interface ProductMeta {
  draft: boolean;
  createdAt?: string;
  quoteOnly?: boolean;
  hidePrice?: boolean;
}

type ProductMetaMap = Record<string, ProductMeta>;

const metaPath = path.join(process.cwd(), 'data', 'product-meta.json');
const remoteMetaPath = 'settings/product-meta.json';

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readMeta(): Promise<ProductMetaMap> {
  if (hasSupabaseConfig()) {
    const { data, error } = await getSupabase().storage.from(PRIVATE_STORAGE_BUCKET).download(remoteMetaPath);
    // Fallar cerrado: un error de Storage no debe publicar borradores o perder restricciones.
    if (error || !data) throw new Error('No se pudo leer la configuración privada de productos.');
    return JSON.parse(await data.text()) as ProductMetaMap;
  }
  try {
    return JSON.parse(await readFile(metaPath, 'utf8')) as ProductMetaMap;
  } catch {
    return {};
  }
}

async function writeMeta(meta: ProductMetaMap): Promise<void> {
  if (hasSupabaseConfig()) {
    const { error } = await getSupabase().storage.from(PRIVATE_STORAGE_BUCKET).upload(
      remoteMetaPath,
      JSON.stringify(meta),
      { upsert: true, contentType: 'application/json', cacheControl: '0' },
    );
    if (error) throw new Error(`No se pudo guardar el estado de productos: ${error.message}`);
    return;
  }
  const temporaryPath = `${metaPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, metaPath);
}

export async function getProductMetaMap(): Promise<ProductMetaMap> {
  return readMeta();
}

export async function setProductMeta(id: number, value: ProductMeta): Promise<void> {
  const meta = await readMeta();
  meta[String(id)] = value;
  await writeMeta(meta);
}

export async function removeProductMeta(id: number): Promise<void> {
  const meta = await readMeta();
  delete meta[String(id)];
  await writeMeta(meta);
}
