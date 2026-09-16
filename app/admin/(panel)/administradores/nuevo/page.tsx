import { AdminForm } from '@/components/admin/AdminForm';

export const dynamic = 'force-dynamic';

export default function NuevoAdministradorPage() {
  return (
    <div>
      <h1 className="admin-title">Nuevo administrador</h1>
      <AdminForm />
    </div>
  );
}
