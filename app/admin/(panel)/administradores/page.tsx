import Link from 'next/link';
import { getAdmins, getSupabaseAuthUsers } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { ADMIN_USER } from '@/lib/auth';
import { getDisabledNotificationEmails } from '@/lib/notification-settings';
import { DeleteAdminButton } from '@/components/admin/DeleteAdminButton';
import { NotificationToggle } from '@/components/admin/NotificationToggle';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  principal: 'Acceso principal',
  db: 'Base de datos',
  auth: 'Supabase Auth',
};

export default async function AdministradoresPage() {
  const [dbAdmins, authUsers, disabled] = await Promise.all([
    getAdmins(),
    getSupabaseAuthUsers(),
    getDisabledNotificationEmails(),
  ]);
  const disabledSet = new Set(disabled);

  type Row = { key: string; nombre: string; email: string; tipo: string; createdAt: string; id?: number };
  const rows: Row[] = [
    { key: 'principal', nombre: 'Administrador principal', email: ADMIN_USER, tipo: 'principal', createdAt: '' },
    ...dbAdmins.map((a) => ({
      key: `db-${a.id}`,
      nombre: a.nombre,
      email: a.email,
      tipo: 'db',
      createdAt: a.createdAt,
      id: a.id,
    })),
    ...authUsers.map((u) => ({
      key: `auth-${u.id}`,
      nombre: u.email.split('@')[0] || u.email,
      email: u.email,
      tipo: 'auth',
      createdAt: '',
    })),
  ];

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <h1 className="admin-title" style={{ margin: 0 }}>
          Administradores
        </h1>
        <Link href="/admin/administradores/nuevo" className="btn btn--red">
          + Nuevo administrador
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Tipo</th>
              <th>Notificaciones</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <strong>{r.nombre}</strong>
                </td>
                <td>{r.email}</td>
                <td>
                  <span className={`media-badge media-badge--${r.tipo === 'principal' ? 'banner' : r.tipo === 'db' ? 'subida' : 'producto'}`}>
                    {TYPE_LABEL[r.tipo]}
                  </span>
                </td>
                <td>
                  {r.tipo === 'principal' ? (
                    <span className="admin-muted">—</span>
                  ) : (
                    <NotificationToggle
                      email={r.email}
                      enabled={!disabledSet.has(r.email.toLowerCase())}
                    />
                  )}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {r.tipo === 'db' && (
                    <>
                      <Link href={`/admin/administradores/${r.id}`} className="admin-link">
                        Editar
                      </Link>{' '}
                      <DeleteAdminButton id={r.id!} />
                    </>
                  )}
                  {r.tipo === 'principal' && <span className="admin-muted">Variables de entorno</span>}
                  {r.tipo === 'auth' && <span className="admin-muted">Usuario de Supabase Auth</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
