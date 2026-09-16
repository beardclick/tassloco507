'use client';

import { useState } from 'react';
import type { Order } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { OrderEditForm } from './OrderEditForm';

export function OrderDetail({ order }: { order: Order }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <OrderEditForm order={order} onCancel={() => setEditing(false)} />;
  }

  return (
    <div>
      <div className="admin-grid">
        <div className="admin-card">
          <h2 className="admin-card__title">Artículos</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.slug}>
                  <td>{it.name}</td>
                  <td>× {it.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-summary">
            <div>
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="admin-summary__total">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="admin-card">
            <h2 className="admin-card__title">Cliente</h2>
            <dl className="admin-dl">
              <dt>Nombre</dt>
              <dd>
                {order.customer.nombre} {order.customer.apellido}
              </dd>
              <dt>Teléfono / WhatsApp</dt>
              <dd>{order.customer.telefono || '—'}</dd>
              <dt>Correo</dt>
              <dd>{order.customer.email || '—'}</dd>
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-card__title">Entrega</h2>
            <dl className="admin-dl">
              <dt>Método</dt>
              <dd>{order.delivery.method === 'recoger' ? 'Recoger en tienda' : 'Envío a domicilio'}</dd>
              {order.delivery.method === 'envio' && (
                <>
                  <dt>Dirección</dt>
                  <dd>
                    {order.delivery.provincia}, {order.delivery.ciudad} — {order.delivery.direccion}
                  </dd>
                  {order.delivery.referencia && (
                    <>
                      <dt>Referencia</dt>
                      <dd>{order.delivery.referencia}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-card__title">Pago</h2>
            <p className="admin-muted">
              {order.payment.method === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo (contra entrega)'}{' '}
              — sin procesamiento de pago (se confirma manualmente).
            </p>
          </div>
        </div>
      </div>

      <button className="btn btn--black btn--lg" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>
        Editar pedido
      </button>
    </div>
  );
}
