import Link from 'next/link';
import { getCustomers, getOrders } from '@/lib/db';
import { DeleteCustomerButton } from '@/components/admin/DeleteCustomerButton';

export const dynamic = 'force-dynamic';

export default function AdminClientes() {
  const customers = getCustomers();
  const orders = getOrders();

  const orderCount = (email: string) =>
    orders.filter((o) => o.customer.email.toLowerCase() === email.toLowerCase()).length;

  return (
    <div>
      <h1 className="admin-title">Clientes</h1>
      <div className="admin-card">
        {customers.length === 0 ? (
          <p className="admin-empty">
            Aún no hay clientes registrados. Aparecerán aquí cuando alguien cree una cuenta en{' '}
            <strong>/registro</strong>.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Pedidos</th>
                <th>Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>
                      {c.nombre} {c.apellido}
                    </strong>
                  </td>
                  <td>{c.email}</td>
                  <td className="admin-muted">{c.telefono || '—'}</td>
                  <td>{orderCount(c.email)}</td>
                  <td className="admin-muted">{new Date(c.createdAt).toLocaleDateString('es-PA')}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/clientes/${c.id}`} className="admin-link">
                      Editar
                    </Link>{' '}
                    <DeleteCustomerButton id={c.id} />
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
