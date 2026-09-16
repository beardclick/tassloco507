import type { ProductSummary } from './client-types';
import {
  getCategories as dbGetCategories,
  getProducts as dbGetProducts,
} from './db';

export interface ProductImage {
  src: string;
  thumbnail: string;
  alt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  link: string;
}

export interface Prices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: string;
  permalink: string;
  on_sale: boolean;
  in_stock: boolean;
  prices: Prices;
  price_html: string;
  sku: string;
  short_description: string;
  description: string;
  images: ProductImage[];
  categories: ProductCategory[];
  tags: string[];
  draft?: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description: string;
  link: string;
  image: string | null;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export async function loadProducts(): Promise<Product[]> {
  return dbGetProducts();
}

export async function loadCategories(): Promise<Category[]> {
  return dbGetCategories();
}

async function catById(): Promise<Map<number, Category>> {
  return new Map((await loadCategories()).map((c) => [c.id, c]));
}

export async function getCategoryByPath(segments: string[]): Promise<Category | undefined> {
  const cats = await loadCategories();
  let current: Category | undefined;
  for (const seg of segments) {
    const candidates = cats.filter(
      (c) => c.slug === seg && (!current ? c.parent === 0 : c.parent === current.id),
    );
    if (candidates.length === 0) return undefined;
    current = candidates[0];
  }
  return current;
}

/** Full slug path for a category, e.g. ['auto-parts', 'lip-auto-parts']. */
export async function categorySlugPath(cat: Category): Promise<string[]> {
  const map = await catById();
  const path: string[] = [];
  let cur: Category | undefined = cat;
  let guard = 0;
  while (cur && guard < 10) {
    path.unshift(cur.slug);
    cur = cur.parent ? map.get(cur.parent) : undefined;
    guard += 1;
  }
  return path;
}

export async function categoryPath(cat: Category): Promise<string> {
  return '/categoria-producto/' + (await categorySlugPath(cat)).join('/');
}

export async function categoryTree(): Promise<CategoryNode[]> {
  const cats = await loadCategories();
  const map = new Map<number, CategoryNode>();
  for (const c of cats) map.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const c of cats) {
    const node = map.get(c.id)!;
    if (c.parent && map.has(c.parent)) {
      map.get(c.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortChildren = (n: CategoryNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  };
  roots.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  for (const r of roots) sortChildren(r);
  return roots;
}

export async function getCategoryChildren(cat: Category): Promise<Category[]> {
  const cats = await loadCategories();
  return cats
    .filter((c) => c.parent === cat.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const cats = await loadCategories();
  return cats.find((c) => c.slug === slug);
}

/** All category ids in this category's subtree (including itself). */
export async function categorySubtreeIds(cat: Category): Promise<number[]> {
  const cats = await loadCategories();
  const ids = new Set<number>([cat.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of cats) {
      if (c.parent && ids.has(c.parent) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return [...ids];
}

export async function getProductsForCategory(cat: Category): Promise<Product[]> {
  const ids = new Set(await categorySubtreeIds(cat));
  const products = await loadProducts();
  return products.filter((p) => p.categories.some((c) => ids.has(c.id)));
}

export async function getCategoryProductCount(cat: Category): Promise<number> {
  return (await getProductsForCategory(cat)).length;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return dbGetProducts().then((all) => all.find((p) => p.slug === slug));
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await loadProducts();
  const catIds = new Set(product.categories.map((c) => c.id));
  const scored = all
    .filter((p) => p.slug !== product.slug)
    .map((p) => {
      let score = 0;
      if (p.categories.some((c) => catIds.has(c.id))) score += 2;
      const tags = new Set(product.tags);
      if (p.tags.some((t) => tags.has(t))) score += 1;
      if (p.images.length > 0) score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || b.p.id - a.p.id);
  return scored.slice(0, limit).map((s) => s.p);
}

export async function productsWithImages(): Promise<Product[]> {
  const all = await loadProducts();
  return all.filter((p) => p.images.length > 0);
}

export async function featuredProducts(limit = 8): Promise<Product[]> {
  const all = await loadProducts();
  return all
    .filter((p) => p.in_stock && p.images.length > 0)
    .sort((a, b) => b.id - a.id)
    .slice(0, limit);
}

export function formatPrice(p: Prices): string {
  const minor = p.currency_minor_unit ?? 2;
  const value = Number(p.price) / Math.pow(10, minor);
  const prefix = p.currency_prefix ?? '$';
  return `${prefix}${value.toLocaleString('en-US', {
    minimumFractionDigits: minor,
    maximumFractionDigits: minor,
  })}`;
}

export function formatRegularPrice(p: Prices): string {
  const minor = p.currency_minor_unit ?? 2;
  const value = Number(p.regular_price) / Math.pow(10, minor);
  const prefix = p.currency_prefix ?? '$';
  return `${prefix}${value.toLocaleString('en-US', {
    minimumFractionDigits: minor,
    maximumFractionDigits: minor,
  })}`;
}

export function moneyValue(p: Prices): number {
  const minor = p.currency_minor_unit ?? 2;
  return Number(p.price) / Math.pow(10, minor);
}

export function toSummary(p: Product): ProductSummary {
  return {
    slug: p.slug,
    name: p.name,
    price: moneyValue(p.prices),
    regularPrice: p.on_sale
      ? Number(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit ?? 2)
      : undefined,
    onSale: p.on_sale,
    inStock: p.in_stock,
    image: p.images.length > 0 ? p.images[0].src : null,
    categoryNames: p.categories.map((c) => c.name),
    link: `/producto/${p.slug}`,
  };
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const all = await loadProducts();
  return all.filter((p) => {
    const haystack = [
      p.name,
      p.slug,
      p.short_description,
      p.sku,
      ...p.categories.map((c) => c.name),
      ...p.tags,
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
