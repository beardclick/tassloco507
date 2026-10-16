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
