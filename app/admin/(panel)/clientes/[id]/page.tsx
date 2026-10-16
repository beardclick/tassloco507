import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById } from '@/lib/db';
import { CustomerForm } from '@/components/admin/CustomerForm';

export const dynamic = 'force-dynamic';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  if (!customer) notFound();
  const { passwordHash: _passwordHash, ...safeCustomer } = customer;
  void _passwordHash;

  return (
    <div>
      <Link href="/admin/clientes" className="admin-link">
        ← Clientes
      </Link>
      <h1 className="admin-title" style={{ margin: '6px 0 20px' }}>
        Editar cliente
      </h1>
      <CustomerForm customer={safeCustomer} />
    </div>
  );
}
