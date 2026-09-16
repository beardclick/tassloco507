import Link from 'next/link';
import { getAdmins } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { DeleteAdminButton } from '@/components/admin/DeleteAdminButton';

export const dynamic = 'force-dynamic';

export default async function AdministradoresPage() {
  const admins = await getAdmins();

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
        {admins.length === 0 ? (
          <p className="admin-empty">
            No hay administradores adicionales. Usa el acceso principal (variables de entorno) o crea
            uno nuevo.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.nombre}</strong>
                  </td>
                  <td>{a.email}</td>
                  <td className="admin-muted">{formatDate(a.createdAt)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/administradores/${a.id}`} className="admin-link">
                      Editar
                    </Link>{' '}
                    <DeleteAdminButton id={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
