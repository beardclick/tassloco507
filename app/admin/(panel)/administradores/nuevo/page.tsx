import { requireAdmin } from '@/lib/auth';
import { AdminForm } from '@/components/admin/AdminForm';

export const dynamic = 'force-dynamic';

export default async function NuevoAdministradorPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="admin-title">Nuevo administrador</h1>
      <AdminForm />
    </div>
  );
}
