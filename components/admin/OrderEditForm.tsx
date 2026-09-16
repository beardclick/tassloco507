'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/db';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/order';
import { PROVINCIAS } from '@/lib/site';
import { formatMoney } from '@/lib/money';

interface ItemEdit {
  slug: string;
  name: string;
  price: string;
  qty: number;
  image: string | null;
}

export function OrderEditForm({ order }: { order: Order }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(order.customer);
  const [delivery, setDelivery] = useState(order.delivery);
  const [payment, setPayment] = useState<'transferencia' | 'efectivo'>(order.payment.method);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [items, setItems] = useState<ItemEdit[]>(
    order.items.map((i) => ({
      slug: i.slug,
      name: i.name,
      price: String(i.price),
      qty: i.qty,
      image: i.image,
    })),
  );
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((n, i) => n + (Number(i.price) || 0) * i.qty, 0);

  function updateItem(index: number, patch: Partial<ItemEdit>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function addItem() {
    if (!newName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        name: newName.trim(),
        price: newPrice,
        qty: Number(newQty) || 1,
        image: null,
      },
    ]);
    setNewName('');
    setNewPrice('');
    setNewQty('1');
  }

  async function save() {
    setSaving(true);
    setError('');
    const payload = {
      status,
      customer,
      delivery,
      payment: { method: payment },
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        price: Number(i.price) || 0,
        qty: i.qty,
        image: i.image,
      })),
      subtotal,
      total: subtotal,
    };
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.refresh();
      } else {
        setError(data.error || 'No se pudo guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card">
      <h2 className="admin-card__title">Editar pedido</h2>

      <h3 className="admin-card__title" style={{ fontSize: '0.9rem' }}>Artículos</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Producto</th>
            <th>Precio</th>
            <th style={{ width: 70 }}>Cant.</th>
            <th style={{ textAlign: 'right' }}>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={`${it.slug}-${i}`}>
              <td>
                <input
                  value={it.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                  style={{ width: '100%', padding: '7px 9px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.price}
                  onChange={(e) => updateItem(i, { price: e.target.value })}
                  style={{ width: 90, padding: '7px 9px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={it.qty}
                  onChange={(e) => updateItem(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  style={{ width: 60, padding: '7px 9px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
                />
              </td>
              <td style={{ textAlign: 'right' }}>{formatMoney((Number(it.price) || 0) * it.qty)}</td>
              <td style={{ textAlign: 'right' }}>
                <button type="button" className="admin-link admin-link--danger" onClick={() => removeItem(i)}>
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuevo producto"
          style={{ flex: 1, minWidth: 140, padding: '8px 10px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
        />
        <input
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Precio"
          style={{ width: 100, padding: '8px 10px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
        />
        <input
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          type="number"
          min="1"
          placeholder="Cant"
          style={{ width: 70, padding: '8px 10px', border: '1.5px solid var(--gray-300)', borderRadius: 8 }}
        />
        <button type="button" className="btn btn--black btn--sm" onClick={addItem}>
          + Añadir
        </button>
      </div>

      <div className="admin-summary" style={{ marginTop: 16 }}>
        <div>
          <span>Total</span>
          <span className="admin-summary__total">{formatMoney(subtotal)}</span>
        </div>
      </div>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="form-field">
          <label>Nombre</label>
          <input value={customer.nombre} onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Apellido</label>
          <input value={customer.apellido} onChange={(e) => setCustomer({ ...customer, apellido: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Correo</label>
          <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Teléfono / WhatsApp</label>
          <input value={customer.telefono} onChange={(e) => setCustomer({ ...customer, telefono: e.target.value })} />
        </div>

        <div className="form-field">
          <label>Entrega</label>
          <select
            value={delivery.method}
            onChange={(e) => setDelivery({ ...delivery, method: e.target.value as 'envio' | 'recoger' })}
          >
            <option value="envio">Envío a domicilio</option>
            <option value="recoger">Recoger en tienda</option>
          </select>
        </div>
        <div className="form-field">
          <label>Pago</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value as 'transferencia' | 'efectivo')}>
            <option value="transferencia">Transferencia bancaria</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div className="form-field">
          <label>Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {delivery.method === 'envio' && (
          <>
            <div className="form-field">
              <label>Provincia</label>
              <select
                value={delivery.provincia ?? ''}
                onChange={(e) => setDelivery({ ...delivery, provincia: e.target.value })}
              >
                <option value="">—</option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Ciudad</label>
              <input value={delivery.ciudad ?? ''} onChange={(e) => setDelivery({ ...delivery, ciudad: e.target.value })} />
            </div>
            <div className="form-field form-field--full">
              <label>Dirección</label>
              <input value={delivery.direccion ?? ''} onChange={(e) => setDelivery({ ...delivery, direccion: e.target.value })} />
            </div>
            <div className="form-field form-field--full">
              <label>Referencia</label>
              <input value={delivery.referencia ?? ''} onChange={(e) => setDelivery({ ...delivery, referencia: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {error && <p className="admin-login__error" style={{ marginTop: 12 }}>{error}</p>}

      <button className="btn btn--red btn--lg" style={{ marginTop: 20 }} onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}
