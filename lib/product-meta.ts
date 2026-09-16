import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface ProductMeta {
  draft: boolean;
  createdAt?: string;
}

type ProductMetaMap = Record<string, ProductMeta>;

const metaPath = path.join(process.cwd(), 'data', 'product-meta.json');

async function readMeta(): Promise<ProductMetaMap> {
  try {
    return JSON.parse(await readFile(metaPath, 'utf8')) as ProductMetaMap;
  } catch {
    return {};
  }
}

async function writeMeta(meta: ProductMetaMap): Promise<void> {
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
