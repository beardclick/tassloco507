import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { revalidateTag, unstable_cache } from 'next/cache';
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

/**
 * Versión cacheada para el sitio público: evita descargar y parsear
 * settings/product-meta.json de Storage en cada render de producto.
 * Se invalida con revalidateTag('public-product-meta') al guardar un producto.
 */
export const getPublicProductMetaMap = unstable_cache(
  async (): Promise<ProductMetaMap> => readMeta(),
  ['public-product-meta-v1'],
  { revalidate: 86400, tags: ['public-product-meta'] },
);

export async function setProductMeta(id: number, value: ProductMeta): Promise<void> {
  const meta = await readMeta();
  meta[String(id)] = value;
  await writeMeta(meta);
  revalidateTag('public-product-meta');
  revalidateTag('public-catalog');
}

export async function removeProductMeta(id: number): Promise<void> {
  const meta = await readMeta();
  delete meta[String(id)];
  await writeMeta(meta);
  revalidateTag('public-product-meta');
  revalidateTag('public-catalog');
}
