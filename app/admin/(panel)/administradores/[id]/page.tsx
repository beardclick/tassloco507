import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminById } from '@/lib/db';
import { AdminForm } from '@/components/admin/AdminForm';

export const dynamic = 'force-dynamic';

export default async function EditarAdministradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await getAdminById(Number(id));
  if (!admin) notFound();

  return (
    <div>
      <Link href="/admin/administradores" className="admin-link">
        ← Administradores
      </Link>
      <h1 className="admin-title" style={{ margin: '6px 0 20px' }}>
        Editar administrador
      </h1>
      <AdminForm admin={admin} />
    </div>
  );
}
