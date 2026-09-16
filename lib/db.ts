import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Category, Product, ProductCategory, Prices } from './catalog';
import type { OrderStatus } from './order';

export type { OrderStatus };
export { ORDER_STATUSES } from './order';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PRODUCTS = path.join(DATA_DIR, 'products.json');
const SEED_CATEGORIES = path.join(DATA_DIR, 'categories.json');

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
}

export interface CategoryInput {
  name: string;
  parent?: number;
  description?: string;
  image?: string | null;
}

interface DbShape {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
}

let cache: DbShape | null = null;

function ensureSeed(): void {
  if (existsSync(DB_PATH)) return;
  mkdirSync(DATA_DIR, { recursive: true });
  const products = JSON.parse(readFileSync(SEED_PRODUCTS, 'utf8')) as Product[];
  const categories = JSON.parse(readFileSync(SEED_CATEGORIES, 'utf8')) as Category[];
  writeDb({ products, categories, orders: [], customers: [] });
}

function readDb(): DbShape {
  ensureSeed();
  if (!cache) {
    const raw = JSON.parse(readFileSync(DB_PATH, 'utf8')) as Partial<DbShape>;
    const migrated: DbShape = {
      products: Array.isArray(raw.products) ? raw.products : [],
      categories: Array.isArray(raw.categories)
        ? raw.categories
        : (JSON.parse(readFileSync(SEED_CATEGORIES, 'utf8')) as Category[]),
      orders: Array.isArray(raw.orders) ? raw.orders : [],
      customers: Array.isArray(raw.customers) ? raw.customers : [],
    };
    cache = migrated;
    writeFileSync(DB_PATH, JSON.stringify(migrated, null, 1), 'utf8');
  }
  return cache;
}

function writeDb(db: DbShape): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 1), 'utf8');
  cache = db;
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

export function getCategories(): Category[] {
  return readDb().categories;
}

export function getCategoryById(id: number): Category | undefined {
  return readDb().categories.find((c) => c.id === id);
}

export function createCategory(input: CategoryInput): Category {
  const db = readDb();
  const id = db.categories.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  const slug = slugify(input.name) || `categoria-${id}`;
  const cat: Category = {
    id,
    name: input.name,
    slug,
    parent: input.parent ?? 0,
    count: 0,
    description: input.description ?? '',
    link: buildCategoryLink(slug, input.parent ?? 0, db.categories),
    image: input.image ?? null,
  };
  db.categories = recomputeLinks([...db.categories, cat]);
  writeDb(db);
  return cat;
}

export function updateCategory(id: number, input: CategoryInput): Category | undefined {
  const db = readDb();
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const prev = db.categories[idx];
  db.categories[idx] = {
    ...prev,
    name: input.name,
    parent: input.parent ?? prev.parent,
    description: input.description ?? '',
    image: input.image === undefined ? prev.image : input.image,
  };
  db.categories = recomputeLinks(db.categories);
  writeDb(db);
  return db.categories[idx];
}

export function deleteCategory(id: number): boolean {
  const db = readDb();
  const target = db.categories.find((c) => c.id === id);
  if (!target) return false;
  db.categories = db.categories
    .filter((c) => c.id !== id)
    .map((c) => (c.parent === id ? { ...c, parent: target.parent } : c));
  db.categories = recomputeLinks(db.categories);
  db.products = db.products.map((p) => ({
    ...p,
    categories: p.categories.filter((c) => c.id !== id),
  }));
  writeDb(db);
  return true;
}

// ---- Products ----

export function getProducts(): Product[] {
  return readDb().products;
}

export function getProductById(id: number): Product | undefined {
  return readDb().products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return readDb().products.find((p) => p.slug === slug);
}

export function createProduct(input: ProductInput, categories: ProductCategory[]): Product {
  const db = readDb();
  const id = db.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
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
  db.products = [product, ...db.products];
  writeDb(db);
  return product;
}

export function updateProduct(
  id: number,
  input: ProductInput,
  categories: ProductCategory[],
): Product | undefined {
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const prev = db.products[idx];
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
  db.products[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteProduct(id: number): boolean {
  const db = readDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length === before) return false;
  writeDb(db);
  return true;
}

// ---- Orders ----

export function getOrders(): Order[] {
  return readDb().orders;
}

export function getOrderById(id: string): Order | undefined {
  return readDb().orders.find((o) => o.id === id);
}

export function createOrder(data: Omit<Order, 'id' | 'number' | 'createdAt'>): Order {
  const db = readDb();
  const order: Order = {
    ...data,
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    number: `TL-${100000 + Math.floor(Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
  };
  db.orders = [order, ...db.orders];
  writeDb(db);
  return order;
}

export function updateOrder(id: string, data: Partial<Omit<Order, 'id'>>): Order | undefined {
  const db = readDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  db.orders[idx] = { ...db.orders[idx], ...data, id };
  writeDb(db);
  return db.orders[idx];
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | undefined {
  return updateOrder(id, { status });
}

// ---- Customers ----

export function getCustomers(): Customer[] {
  return readDb().customers;
}

export function getCustomerById(id: number): Customer | undefined {
  return readDb().customers.find((c) => c.id === id);
}

export function getCustomerByEmail(email: string): Customer | undefined {
  const e = email.trim().toLowerCase();
  return readDb().customers.find((c) => c.email.toLowerCase() === e);
}

export function createCustomer(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  passwordHash: string;
}): Customer {
  const db = readDb();
  const id = db.customers.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  const customer: Customer = {
    id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email.trim().toLowerCase(),
    telefono: data.telefono,
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.customers = [...db.customers, customer];
  writeDb(db);
  return customer;
}

export function updateCustomer(
  id: number,
  data: { nombre?: string; apellido?: string; email?: string; telefono?: string; passwordHash?: string },
): Customer | undefined {
  const db = readDb();
  const idx = db.customers.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const prev = db.customers[idx];
  db.customers[idx] = {
    ...prev,
    nombre: data.nombre ?? prev.nombre,
    apellido: data.apellido ?? prev.apellido,
    email: (data.email ?? prev.email).trim().toLowerCase(),
    telefono: data.telefono ?? prev.telefono,
    passwordHash: data.passwordHash ?? prev.passwordHash,
  };
  writeDb(db);
  return db.customers[idx];
}

export function deleteCustomer(id: number): boolean {
  const db = readDb();
  const before = db.customers.length;
  db.customers = db.customers.filter((c) => c.id !== id);
  if (db.customers.length === before) return false;
  writeDb(db);
  return true;
}
