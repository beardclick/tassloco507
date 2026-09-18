import { currentAdminIdentity } from '@/lib/auth';
import { getAdminByEmail } from '@/lib/db';
import { ProfileForm } from '@/components/admin/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const identity = await currentAdminIdentity();
  const dbAdmin = identity ? await getAdminByEmail(identity) : undefined;

  return (
    <div>
      <h1 className="admin-title">Mi perfil</h1>

      <div className="admin-card">
        <h2 className="admin-card__title">Información</h2>
        <dl className="admin-dl">
          <dt>Identificador</dt>
          <dd>{identity ?? '—'}</dd>
          <dt>Nombre</dt>
          <dd>{dbAdmin?.nombre ?? '—'}</dd>
          <dt>Tipo de cuenta</dt>
          <dd>
            {dbAdmin
              ? 'Administrador (base de datos)'
              : 'Usuario de Supabase Auth o acceso principal'}
          </dd>
        </dl>
      </div>

      <ProfileForm />
    </div>
  );
}
