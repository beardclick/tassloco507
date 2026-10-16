-- Ejecutar en Supabase > SQL Editor para proteger una instalación existente.
-- Las consultas de la tienda pasan por el servidor con service_role.
-- No se crean políticas públicas para pedidos, clientes ni administradores.
begin;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.admins enable row level security;

revoke all privileges on table
  public.categories, public.products, public.orders, public.customers, public.admins
from anon, authenticated;

commit;

-- Verificar que las cinco tablas muestran rls_enabled = true y acceso público false.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_has_access,
  has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_has_access
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('categories', 'products', 'orders', 'customers', 'admins')
  and c.relkind = 'r'
order by c.relname;
