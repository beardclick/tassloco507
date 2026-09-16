-- Tass Loco 507 — esquema de Supabase (Postgres)
-- Ejecuta este archivo en Supabase → SQL Editor.

create table if not exists categories (
  id bigint primary key,
  name text not null,
  slug text not null,
  parent bigint not null default 0,
  count bigint not null default 0,
  description text not null default '',
  image text,
  link text not null default ''
);

create table if not exists products (
  id bigint primary key,
  name text not null,
  slug text not null unique,
  type text not null default 'simple',
  permalink text not null default '',
  on_sale boolean not null default false,
  in_stock boolean not null default true,
  prices jsonb not null default '{}'::jsonb,
  price_html text not null default '',
  sku text not null default '',
  short_description text not null default '',
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb
);

create table if not exists orders (
  id text primary key,
  number text not null,
  created_at timestamptz not null default now(),
  status text not null default 'pendiente',
  customer jsonb not null default '{}'::jsonb,
  delivery jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total numeric not null default 0
);

create table if not exists customers (
  id bigserial primary key,
  nombre text not null,
  apellido text not null default '',
  email text not null unique,
  telefono text not null default '',
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_products_slug on products (slug);
create index if not exists idx_orders_number on orders (number);
create index if not exists idx_customers_email on customers (email);
