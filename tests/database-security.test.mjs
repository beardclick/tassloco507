import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migraciones: RLS, permisos, contador atómico y restricciones Storage en PostgreSQL', async t => {
  const db = new PGlite();
  try {
    // Esquemas y roles que Supabase proporciona; incluir una política pública
    // permisiva preexistente comprueba que las restricciones nuevas prevalecen.
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema storage;
      grant usage on schema public, storage to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to service_role;
      create table storage.buckets (id text primary key, name text, public boolean);
      create table storage.objects (id bigint generated always as identity primary key, bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant all on storage.objects to anon, authenticated, service_role;
      grant usage on sequence storage.objects_id_seq to anon, authenticated, service_role;
      create policy permissive_legacy on storage.objects for all to anon, authenticated using (true) with check (true);
    `);
    const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
    const migration1 = await readFile(new URL('../supabase/migrations/202610150001_enable_table_rls.sql', import.meta.url), 'utf8');
    const migration2 = await readFile(new URL('../supabase/migrations/202610150002_app_security.sql', import.meta.url), 'utf8');
    await db.exec(schema);
    await db.exec(migration1);
    await db.exec(migration2);
    // Repetibilidad: ejecutar otra vez no cambia permisos ni falla.
    await db.exec(migration2);

    await t.test('siete tablas protegidas, service_role conserva acceso', async () => {
      const { rows } = await db.query(`
        select c.relname, c.relrowsecurity,
          has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as anon_access,
          has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as authenticated_access,
          has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as service_access
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
      `);
      assert.equal(rows.length, 7);
      for (const row of rows) {
        assert.equal(row.relrowsecurity, true, row.relname);
        assert.equal(row.anon_access, false, row.relname);
        assert.equal(row.authenticated_access, false, row.relname);
        assert.equal(row.service_access, true, row.relname);
      }
      for (const role of ['anon', 'authenticated']) {
        await db.exec('set role ' + role);
        await assert.rejects(db.query('select * from public.customers'), /permission denied/);
        await assert.rejects(db.query('select public.security_check_rate_limit($1,5,900)', ['a'.repeat(64)]), /permission denied/);
        await db.exec('reset role');
      }
    });

    await t.test('cuenta hasta el límite, deniega exceso y se reinicia al vencer', async () => {
      await db.exec('set role service_role');
      const query = () => db.query('select public.security_check_rate_limit($1,3,900) as result', ['a'.repeat(64)]);
      const results = await Promise.all(Array.from({ length: 8 }, query));
      assert.equal(results.filter(result => result.rows[0].result.allowed).length, 3);
      assert.ok(results[7].rows[0].result.retry_after > 0);
      await db.query("update public.security_rate_limits set expires_at = clock_timestamp() - interval '1 second'");
      assert.equal((await query()).rows[0].result.allowed, true);
      await assert.rejects(db.query('select public.security_check_rate_limit($1,3,1)', ['a'.repeat(64)]), /Invalid rate limit parameters/);
      await db.exec('reset role');
    });

    await t.test('Storage bloquea escritura pública incluso con una política antigua permisiva', async () => {
      await db.exec("insert into storage.objects(bucket_id,name) values ('server-settings','settings/notification-prefs.json'),('product-images','settings/homepage.json'),('product-images','photo.jpg')");
      for (const role of ['anon', 'authenticated']) {
        await db.exec('set role ' + role);
        assert.deepEqual((await db.query('select name from storage.objects order by name')).rows, [{ name: 'photo.jpg' }]);
        await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('product-images','evil.svg')"), /row-level security/);
        assert.equal((await db.query("delete from storage.objects where name='photo.jpg' returning id")).rows.length, 0);
        assert.equal((await db.query("update storage.objects set name='replaced.jpg' where name='photo.jpg' returning id")).rows.length, 0);
        await db.exec('reset role');
      }
      assert.deepEqual((await db.query("select public from storage.buckets where id='server-settings'")).rows, [{ public: false }]);
    });

    await t.test('pedidos históricos no se asocian automáticamente por correo', async () => {
      await db.exec("insert into public.customers(nombre,email,password_hash) values ('Owner','owner@example.com','hash')");
      await db.exec("insert into public.orders(id,number,customer) values ('old','OLD','{\"email\":\"owner@example.com\"}')");
      assert.equal((await db.query("select customer_id from public.orders where id='old'")).rows[0].customer_id, null);
    });
  } finally {
    await db.close();
  }
});
