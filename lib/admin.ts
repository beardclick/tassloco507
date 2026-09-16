import { categoryPath, loadCategories } from './catalog';
import type { ProductCategory } from './catalog';
import type { ProductInput } from './db';

export async function resolveCategories(categoryIds?: number[]): Promise<ProductCategory[]> {
  if (!categoryIds || categoryIds.length === 0) return [];
  const cats = await loadCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const out: ProductCategory[] = [];
  for (const id of categoryIds) {
    const c = byId.get(id);
    if (c) {
      out.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        link: `https://tassloco507.com${await categoryPath(c)}`,
      });
    }
  }
  return out;
}

export interface CategoryOption {
  id: number;
  name: string;
  depth: number;
}

export async function flattenCategories(): Promise<CategoryOption[]> {
  const cats = await loadCategories();
  const result: CategoryOption[] = [];
  function walk(parentId: number, depth: number) {
    const children = cats
      .filter((c) => c.parent === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    for (const c of children) {
      result.push({ id: c.id, name: c.name, depth });
      walk(c.id, depth + 1);
    }
  }
  walk(0, 0);
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseProductInput(body: any): ProductInput {
  const price = Number(body.price ?? 0);
  const regularPrice = body.regularPrice ? Number(body.regularPrice) : undefined;
  return {
    name: String(body.name ?? '').trim(),
    price: Number.isFinite(price) ? price : 0,
    regularPrice: regularPrice && Number.isFinite(regularPrice) ? regularPrice : undefined,
    onSale: Boolean(body.onSale),
    inStock: body.inStock !== false,
    sku: String(body.sku ?? '').trim(),
    shortDescription: String(body.shortDescription ?? '').trim(),
    description: String(body.description ?? '').trim(),
    images: Array.isArray(body.images)
      ? body.images.map((s: unknown) => String(s).trim()).filter(Boolean)
      : undefined,
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(Number) : undefined,
    tags: String(body.tags ?? '').trim(),
  };
}
