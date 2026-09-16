import { getSupabase } from './supabase';
import type { Category, Product, ProductCategory, Prices } from './catalog';
import type { OrderStatus } from './order';
import { getProductMetaMap, removeProductMeta, setProductMeta } from './product-meta';

export type { OrderStatus };
export { ORDER_STATUSES } from './order';

export interface OrderItem {
  slug: string;
  name: string;
  price: number;
  qty: number;
  image: string | null;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  delivery: {
    method: 'envio' | 'recoger';
    provincia?: string;
    ciudad?: string;
    direccion?: string;
    referencia?: string;
  };
  payment: {
    method: 'transferencia' | 'efectivo';
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
}

export interface Customer {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  passwordHash: string;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  price: number;
  regularPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sku?: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  categoryIds?: number[];
  tags?: string;
  draft?: boolean;
}

export interface CategoryInput {
  name: string;
  parent?: number;
  description?: string;
  image?: string | null;
}

const sb = () => getSupabase();

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function makePrices(price: number, regularPrice?: number, onSale?: boolean): Prices {
  const minor = 2;
  const p = Math.round(price * Math.pow(10, minor)).toString();
  const r = Math.round((regularPrice ?? price) * Math.pow(10, minor)).toString();
  return {
    price: p,
    regular_price: r,
    sale_price: onSale ? p : r,
    currency_code: 'USD',
    currency_symbol: '$',
    currency_minor_unit: minor,
    currency_decimal_separator: '.',
    currency_thousand_separator: ',',
    currency_prefix: '$',
    currency_suffix: '',
  };
}

function buildImages(urls: string[] | undefined, alt: string): { src: string; thumbnail: string; alt: string }[] {
  return (urls ?? []).filter(Boolean).map((src) => ({ src, thumbnail: src, alt }));
}

// Algunos productos importados conservan la entidad HTML literal del guion largo.
// Normalizamos al mostrar/usar el catálogo sin tener que editar cada registro.
function normalizeDash(value: unknown): string {
  return String(value ?? '').replace(/(?:&#8211;?|&ndash;?)/gi, '-');
}

function normalizeProductText(product: Product): Product {
  return {
    ...product,
    name: normalizeDash(product.name),
    short_description: normalizeDash(product.short_description),
    description: normalizeDash(product.description),
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToOrder(row: any): Order {
  return {
    id: row.id,
    number: row.number,
    createdAt: row.created_at,
    status: row.status,
    customer: row.customer ?? {},
    delivery: row.delivery ?? {},
    payment: row.payment ?? {},
    items: row.items ?? [],
    subtotal: num(row.subtotal),
    total: num(row.total),
  };
}

function orderToRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    number: order.number,
    created_at: order.createdAt,
    status: order.status,
    customer: order.customer,
    delivery: order.delivery,
    payment: order.payment,
    items: order.items,
    subtotal: order.subtotal,
    total: order.total,
  };
}

function rowToCustomer(row: any): Customer {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- Categories ----

function buildCategoryLink(slug: string, parentId: number, cats: Category[]): string {
  const byId = new Map(cats.map((c) => [c.id, c]));
  const segs: string[] = [];
  let cur = parentId;
  let guard = 0;
  while (cur && guard < 10) {
    const p = byId.get(cur);
    if (!p) break;
    segs.unshift(p.slug);
    cur = p.parent;
    guard += 1;
  }
  segs.push(slug);
  return '/categoria-producto/' + segs.join('/');
}

function recomputeLinks(cats: Category[]): Category[] {
  return cats.map((c) => ({ ...c, link: buildCategoryLink(c.slug, c.parent, cats) }));
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await sb().from('categories').select('*').order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const { data, error } = await sb().from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Category) ?? undefined;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const all = await getCategories();
  const id = all.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  const slug = slugify(input.name) || `categoria-${id}`;
  const cat: Category = {
    id,
    name: input.name,
    slug,
    parent: input.parent ?? 0,
    count: 0,
    description: input.description ?? '',
    link: buildCategoryLink(slug, input.parent ?? 0, all),
    image: input.image ?? null,
  };
  const { error } = await sb().from('categories').insert(cat);
  if (error) throw error;
  // Recompute links of the whole set (parent may have changed).
  await persistCategoryLinks(recomputeLinks([...all, cat]));
  return cat;
}

async function persistCategoryLinks(cats: Category[]): Promise<void> {
  for (const c of cats) {
    await sb().from('categories').update({ link: c.link }).eq('id', c.id);
  }
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category | undefined> {
  const all = await getCategories();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const prev = all[idx];
  const updated: Category = {
    ...prev,
    name: input.name,
    parent: input.parent ?? prev.parent,
    description: input.description ?? '',
    image: input.image === undefined ? prev.image : input.image,
  };
  const { error } = await sb().from('categories').update(updated).eq('id', id);
  if (error) throw error;
  await persistCategoryLinks(recomputeLinks(all.map((c) => (c.id === id ? updated : c))));
  return updated;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const all = await getCategories();
  const target = all.find((c) => c.id === id);
  if (!target) return false;

  // Reassign children to the deleted category's parent.
  for (const c of all) {
    if (c.parent === id) {
      await sb().from('categories').update({ parent: target.parent }).eq('id', c.id);
    }
  }
  await sb().from('categories').delete().eq('id', id);

  // Remove the category reference from products.
  const { data: products } = await sb().from('products').select('id, categories');
  for (const p of (products ?? []) as { id: number; categories: ProductCategory[] }[]) {
    const filtered = (p.categories ?? []).filter((c) => c.id !== id);
    if (filtered.length !== (p.categories ?? []).length) {
      await sb().from('products').update({ categories: filtered }).eq('id', p.id);
    }
  }

  const remaining = recomputeLinks(all.filter((c) => c.id !== id));
  await persistCategoryLinks(remaining);
  return true;
}

// ---- Products ----

export async function getProducts(includeDrafts = false): Promise<Product[]> {
  const { data, error } = await sb().from('products').select('*').order('id', { ascending: false });
  if (error) throw error;
  const meta = await getProductMetaMap();
  const products = ((data ?? []) as Product[]).map((product) => ({
    ...normalizeProductText(product),
    draft: meta[String(product.id)]?.draft ?? false,
    createdAt: meta[String(product.id)]?.createdAt,
  }));
  return includeDrafts ? products : products.filter((product) => !product.draft);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const { data, error } = await sb().from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const meta = await getProductMetaMap();
  return {
    ...normalizeProductText(data as Product),
    draft: meta[String(id)]?.draft ?? false,
    createdAt: meta[String(id)]?.createdAt,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await sb().from('products').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const product = normalizeProductText(data as Product);
  const meta = await getProductMetaMap();
  if (meta[String(product.id)]?.draft) return undefined;
  return { ...product, draft: false, createdAt: meta[String(product.id)]?.createdAt };
}

export async function createProduct(input: ProductInput, categories: ProductCategory[]): Promise<Product> {
  const { data } = await sb().from('products').select('id').order('id', { ascending: false }).limit(1);
  const id = (data && data[0] ? data[0].id : 0) + 1;
  const slug = slugify(input.name) || `producto-${id}`;
  const product: Product = {
    id,
    name: input.name,
    slug,
    type: 'simple',
    permalink: `https://tassloco507.com/producto/${slug}`,
    on_sale: Boolean(input.onSale),
    in_stock: input.inStock !== false,
    prices: makePrices(input.price, input.regularPrice, input.onSale),
    price_html: '',
    sku: input.sku ?? '',
    short_description: input.shortDescription ?? '',
    description: input.description ?? '',
    images: buildImages(input.images, input.name),
    categories,
    tags: (input.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
  };
  const { error } = await sb().from('products').insert(product);
  if (error) throw error;
  const createdAt = new Date().toISOString();
  await setProductMeta(id, { draft: Boolean(input.draft), createdAt });
  return { ...product, draft: Boolean(input.draft), createdAt };
}

export async function updateProduct(
  id: number,
  input: ProductInput,
  categories: ProductCategory[],
): Promise<Product | undefined> {
  const prev = await getProductById(id);
  if (!prev) return undefined;
  const updated: Product = {
    ...prev,
    name: input.name,
    on_sale: Boolean(input.onSale),
    in_stock: input.inStock !== false,
    prices: makePrices(input.price, input.regularPrice, input.onSale),
    sku: input.sku ?? '',
    short_description: input.shortDescription ?? '',
    description: input.description ?? '',
    images:
      input.images && input.images.length > 0 ? buildImages(input.images, input.name) : prev.images,
    categories,
    tags: (input.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
  };
  const { draft: _draft, createdAt: _createdAt, ...productRow } = updated;
  const { error } = await sb().from('products').update(productRow).eq('id', id);
  if (error) throw error;
  await setProductMeta(id, {
    draft: Boolean(input.draft),
    createdAt: prev.createdAt ?? new Date().toISOString(),
  });
  return { ...updated, draft: Boolean(input.draft), createdAt: prev.createdAt };
}

export async function deleteProduct(id: number): Promise<boolean> {
  const { error, count } = await sb().from('products').delete({ count: 'exact' }).eq('id', id);
  if (error) throw error;
  if ((count ?? 0) > 0) await removeProductMeta(id);
  return (count ?? 0) > 0;
}

// ---- Orders ----

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await sb().from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToOrder);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const { data, error } = await sb().from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : undefined;
}

export async function createOrder(data: Omit<Order, 'id' | 'number' | 'createdAt'>): Promise<Order> {
  const order: Order = {
    ...data,
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    number: `TL-${100000 + Math.floor(Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
  };
  const { error } = await sb().from('orders').insert(orderToRow(order));
  if (error) throw error;
  return order;
}

export async function updateOrder(id: string, data: Partial<Omit<Order, 'id'>>): Promise<Order | undefined> {
  const current = await getOrderById(id);
  if (!current) return undefined;
  const merged: Order = { ...current, ...data, id };
  const { error } = await sb()
    .from('orders')
    .update({ ...orderToRow(merged), id: undefined })
    .eq('id', id);
  if (error) throw error;
  return merged;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  return updateOrder(id, { status });
}

// ---- Customers ----

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await sb().from('customers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCustomer);
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const { data, error } = await sb().from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToCustomer(data) : undefined;
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const e = email.trim().toLowerCase();
  const { data, error } = await sb().from('customers').select('*').eq('email', e).maybeSingle();
  if (error) throw error;
  return data ? rowToCustomer(data) : undefined;
}

export async function createCustomer(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  passwordHash: string;
}): Promise<Customer> {
  const row = {
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email.trim().toLowerCase(),
    telefono: data.telefono,
    password_hash: data.passwordHash,
  };
  const { data: inserted, error } = await sb().from('customers').insert(row).select().single();
  if (error) throw error;
  return rowToCustomer(inserted);
}

export async function updateCustomer(
  id: number,
  data: { nombre?: string; apellido?: string; email?: string; telefono?: string; passwordHash?: string },
): Promise<Customer | undefined> {
  const prev = await getCustomerById(id);
  if (!prev) return undefined;
  const row: Record<string, unknown> = {
    nombre: data.nombre ?? prev.nombre,
    apellido: data.apellido ?? prev.apellido,
    email: (data.email ?? prev.email).trim().toLowerCase(),
    telefono: data.telefono ?? prev.telefono,
  };
  if (data.passwordHash) row.password_hash = data.passwordHash;
  const { data: updated, error } = await sb().from('customers').update(row).eq('id', id).select().single();
  if (error) throw error;
  return rowToCustomer(updated);
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const { error, count } = await sb().from('customers').delete({ count: 'exact' }).eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// ---- Admins ----

export interface Admin {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToAdmin(row: any): Admin {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await sb().from('admins').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAdmin);
}

export async function getAdminById(id: number): Promise<Admin | undefined> {
  const { data, error } = await sb().from('admins').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToAdmin(data) : undefined;
}

export async function getAdminByEmail(email: string): Promise<Admin | undefined> {
  const e = email.trim().toLowerCase();
  const { data, error } = await sb().from('admins').select('*').eq('email', e).maybeSingle();
  if (error) throw error;
  return data ? rowToAdmin(data) : undefined;
}

export async function createAdmin(data: {
  nombre: string;
  email: string;
  passwordHash: string;
}): Promise<Admin> {
  const row = {
    nombre: data.nombre,
    email: data.email.trim().toLowerCase(),
    password_hash: data.passwordHash,
  };
  const { data: inserted, error } = await sb().from('admins').insert(row).select().single();
  if (error) throw error;
  return rowToAdmin(inserted);
}

export async function updateAdmin(
  id: number,
  data: { nombre?: string; email?: string; passwordHash?: string },
): Promise<Admin | undefined> {
  const prev = await getAdminById(id);
  if (!prev) return undefined;
  const row: Record<string, unknown> = {
    nombre: data.nombre ?? prev.nombre,
    email: (data.email ?? prev.email).trim().toLowerCase(),
  };
  if (data.passwordHash) row.password_hash = data.passwordHash;
  const { data: updated, error } = await sb().from('admins').update(row).eq('id', id).select().single();
  if (error) throw error;
  return rowToAdmin(updated);
}

export async function deleteAdmin(id: number): Promise<boolean> {
  const { error, count } = await sb().from('admins').delete({ count: 'exact' }).eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
