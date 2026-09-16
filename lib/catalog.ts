import type { ProductSummary } from './client-types';
import { getCategories as dbGetCategories, getProducts as dbGetProducts } from './db';

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

export function loadProducts(): Product[] {
  return dbGetProducts();
}

export function loadCategories(): Category[] {
  return dbGetCategories();
}

const catById = () => new Map(loadCategories().map((c) => [c.id, c]));

export function getCategoryByPath(segments: string[]): Category | undefined {
  const bySlug = new Map<string, Category>();
  for (const c of loadCategories()) {
    bySlug.set(c.slug, c);
  }
  // Walk: find top-level by first segment, then descend.
  let current: Category | undefined;
  for (const seg of segments) {
    const candidates = loadCategories().filter(
      (c) => c.slug === seg && (!current ? c.parent === 0 : c.parent === current.id),
    );
    if (candidates.length === 0) return undefined;
    current = candidates[0];
  }
  return current;
}

/** Full slug path for a category, e.g. ['auto-parts', 'lip-auto-parts']. */
export function categorySlugPath(cat: Category): string[] {
  const map = catById();
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

export function categoryPath(cat: Category): string {
  return '/categoria-producto/' + categorySlugPath(cat).join('/');
}

export function categoryTree(): CategoryNode[] {
  const cats = loadCategories();
  const map = catById();
  const nodes = new Map<number, CategoryNode>();
  for (const c of cats) nodes.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const c of cats) {
    const node = nodes.get(c.id)!;
    if (c.parent && nodes.has(c.parent)) {
      nodes.get(c.parent)!.children.push(node);
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

export function getCategoryChildren(cat: Category): Category[] {
  return loadCategories()
    .filter((c) => c.parent === cat.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** All category ids in this category's subtree (including itself). */
export function categorySubtreeIds(cat: Category): number[] {
  const ids = new Set<number>([cat.id]);
  const cats = loadCategories();
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

export function getProductsForCategory(cat: Category): Product[] {
  const ids = new Set(categorySubtreeIds(cat));
  return loadProducts().filter((p) => p.categories.some((c) => ids.has(c.id)));
}

export function getCategoryProductCount(cat: Category): number {
  return getProductsForCategory(cat).length;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return loadCategories().find((c) => c.slug === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return loadProducts().find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return loadProducts().map((p) => p.slug);
}

export function getAllCategoryPaths(): string[][] {
  return loadCategories().map((c) => categorySlugPath(c));
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const catIds = new Set(product.categories.map((c) => c.id));
  const scored = loadProducts()
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

export function productsWithImages(): Product[] {
  return loadProducts().filter((p) => p.images.length > 0);
}

export function featuredProducts(limit = 8): Product[] {
  // Prefer in-stock products that have images; newest first.
  return loadProducts()
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
    regularPrice: p.on_sale ? Number(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit ?? 2) : undefined,
    onSale: p.on_sale,
    inStock: p.in_stock,
    image: p.images.length > 0 ? p.images[0].src : null,
    categoryNames: p.categories.map((c) => c.name),
    link: `/producto/${p.slug}`,
  };
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return loadProducts().filter((p) => {
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
