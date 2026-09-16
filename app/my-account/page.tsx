import Link from 'next/link';
import { currentCustomer } from '@/lib/customer-auth';
import { getCustomerByEmail, getOrders } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CustomerLogoutButton } from '@/components/CustomerLogoutButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi Cuenta' };

export default async function MyAccountPage() {
  const session = await currentCustomer();

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>
            Mi <span>Cuenta</span>
          </h1>
          <p className="auth-card__sub">Inicia sesión o regístrate para ver tus pedidos.</p>
          <Link href="/login" className="btn btn--red btn--block btn--lg">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="btn btn--black btn--block">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  const customer = getCustomerByEmail(session.email);
  const orders = getOrders().filter(
    (o) => o.customer.email.toLowerCase() === session.email.toLowerCase(),
  );

  return (
    <>
      <section className="page-head">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>
              Hola, <span>{customer?.nombre}</span>
            </h1>
            <p>{customer?.email}</p>
          </div>
          <CustomerLogoutButton />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="admin-card">
            <h2 className="admin-card__title">Mis pedidos</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📦</div>
                <h2>Aún no tienes pedidos</h2>
                <Link href="/shop" className="btn btn--red" style={{ marginTop: 8 }}>
                  Ir a la tienda
                </Link>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.number}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString('es-PA')}</td>
                      <td>{formatMoney(o.total)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
