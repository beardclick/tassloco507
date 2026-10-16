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

create table if not exists admins (
  id bigserial primary key,
  nombre text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_products_slug on products (slug);
create index if not exists idx_orders_number on orders (number);
create index if not exists idx_customers_email on customers (email);
create index if not exists idx_admins_email on admins (email);
create index if not exists idx_categories_slug on categories (slug);
create index if not exists idx_categories_parent on categories (parent);
create index if not exists idx_orders_created_at on orders (created_at);
create index if not exists idx_products_in_stock on products (in_stock);

-- La tienda accede a las tablas desde el servidor con service_role.
-- El navegador solo usa Supabase Auth; no necesita acceso directo a estas tablas.
-- Sin políticas públicas, RLS deniega el acceso de anon/authenticated.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.admins enable row level security;

revoke all privileges on table
  public.categories, public.products, public.orders, public.customers, public.admins
from anon, authenticated;

-- Seguridad de aplicación (misma migración que 202610150002_app_security.sql).
-- Ejecutar ANTES de desplegar esta versión de la aplicación.
-- Requiere las tablas del esquema original. No vincula pedidos antiguos por correo.
begin;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.admins enable row level security;
revoke all privileges on public.categories, public.products, public.orders, public.customers, public.admins from public, anon, authenticated;

alter table public.orders add column if not exists customer_id bigint references public.customers(id) on delete set null;
create index if not exists idx_orders_customer_id on public.orders(customer_id);

create table if not exists public.security_sessions (
  token_hash text primary key,
  kind text not null check (kind in ('admin', 'customer')),
  subject_id text not null,
  identity text not null,
  credential_version text not null,
  expires_at timestamptz not null
);
create index if not exists idx_security_sessions_subject on public.security_sessions(kind, subject_id);
create index if not exists idx_security_sessions_expiry on public.security_sessions(expires_at);

create table if not exists public.security_rate_limits (
  request_key text primary key,
  hits integer not null,
  expires_at timestamptz not null
);
create index if not exists idx_security_rate_limits_expiry on public.security_rate_limits(expires_at);

alter table public.security_sessions enable row level security;
alter table public.security_rate_limits enable row level security;
revoke all privileges on public.security_sessions, public.security_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.security_sessions, public.security_rate_limits to service_role;

-- UPSERT atómico: las instancias de Vercel comparten el mismo contador.
create or replace function public.security_check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result_hits integer;
  result_expiry timestamptz;
  current_time_value timestamptz := clock_timestamp();
begin
  if p_key !~ '^[a-f0-9]{64}$' or p_limit < 1 or p_limit > 10000
    or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  delete from public.security_rate_limits where expires_at < current_time_value - interval '1 day';
  delete from public.security_sessions where expires_at < current_time_value;

  insert into public.security_rate_limits as limits (request_key, hits, expires_at)
  values (p_key, 1, current_time_value + make_interval(secs => p_window_seconds))
  on conflict (request_key) do update set
    hits = case when limits.expires_at <= current_time_value then 1 else least(limits.hits + 1, 10001) end,
    expires_at = case when limits.expires_at <= current_time_value then excluded.expires_at else limits.expires_at end
  returning hits, expires_at into result_hits, result_expiry;

  return jsonb_build_object('allowed', result_hits <= p_limit,
    'retry_after', greatest(1, ceil(extract(epoch from result_expiry - current_time_value))::integer));
end;
$$;
revoke all on function public.security_check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.security_check_rate_limit(text, integer, integer) to service_role;

-- Las imágenes siguen siendo públicas. Su modificación queda reservada al servidor.
-- Las políticas RESTRICTIVE también limitan políticas permisivas preexistentes.
drop policy if exists tassloco_storage_insert_guard on storage.objects;
create policy tassloco_storage_insert_guard on storage.objects as restrictive for insert to anon, authenticated
  with check (bucket_id not in ('product-images', 'server-settings'));
drop policy if exists tassloco_storage_update_guard on storage.objects;
create policy tassloco_storage_update_guard on storage.objects as restrictive for update to anon, authenticated
  using (bucket_id not in ('product-images', 'server-settings'))
  with check (bucket_id not in ('product-images', 'server-settings'));
drop policy if exists tassloco_storage_delete_guard on storage.objects;
create policy tassloco_storage_delete_guard on storage.objects as restrictive for delete to anon, authenticated
  using (bucket_id not in ('product-images', 'server-settings'));
drop policy if exists tassloco_storage_private_read_guard on storage.objects;
create policy tassloco_storage_private_read_guard on storage.objects as restrictive for select to anon, authenticated
  using (bucket_id <> 'server-settings' and (bucket_id <> 'product-images' or name not like 'settings/%'));

insert into storage.buckets (id, name, public)
values ('server-settings', 'server-settings', false)
on conflict (id) do update set public = false;

commit;

-- Debe devolver dos filas con RLS activo y permisos públicos false.
select c.relname, c.relrowsecurity,
  has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as anon_has_access,
  has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as authenticated_has_access
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('security_sessions', 'security_rate_limits');
