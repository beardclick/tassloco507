'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useCart } from '@/components/CartProvider';
import { formatMoney } from '@/lib/money';
import { PAYMENT_METHODS, PROVINCIAS, SITE } from '@/lib/site';
import { CheckIcon, WhatsappIcon } from '@/components/Icons';

type Delivery = 'envio' | 'recoger';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id);
  const [delivery, setDelivery] = useState<Delivery>('envio');
  const [placed, setPlaced] = useState<{ order: string; paymentId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  const activePayment = PAYMENT_METHODS.find((p) => p.id === payment) ?? PAYMENT_METHODS[0];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setLoginRequired(false);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      customer: {
        nombre: String(fd.get('nombre') ?? ''),
        apellido: String(fd.get('apellido') ?? ''),
        email: String(fd.get('email') ?? ''),
        telefono: String(fd.get('tel') ?? ''),
      },
      delivery: {
        method: delivery,
        provincia: String(fd.get('provincia') ?? ''),
        ciudad: String(fd.get('ciudad') ?? ''),
        direccion: String(fd.get('direccion') ?? ''),
        referencia: String(fd.get('ref') ?? ''),
      },
      payment: { method: payment },
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image,
      })),
      subtotal,
      createAccount,
      password: String(fd.get('password') ?? ''),
    };
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPlaced({ order: data.order.number, paymentId: payment });
        clear();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setLoginRequired(data.code === 'LOGIN_REQUIRED');
        setError(data.error || 'No se pudo procesar el pedido');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <>
        <section className="page-head">
          <div className="container">
            <h1>
              Pedido <span>//</span> Recibido
            </h1>
          </div>
        </section>
        <section className="section">
          <div className="container" style={{ maxWidth: 680 }}>
            <div className="checkout__card" style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ width: 70, height: 70, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--black)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <CheckIcon style={{ width: 34, height: 34 }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 6px' }}>
                ¡Gracias por tu pedido!
              </h2>
              <p className="lead">Número de pedido: <strong>{placed.order}</strong></p>

              {placed.paymentId === 'transferencia' && (
                <div className="pay-details" style={{ textAlign: 'left', marginTop: 18 }}>
                  <p style={{ margin: '0 0 8px' }}><strong>Completa tu transferencia a:</strong></p>
                  {activePayment.details.map((d) => (
                    <div className="pay-details__row" key={d.label}>
                      <span>{d.label}</span>
                      <b>{d.value}</b>
                    </div>
                  ))}
                  <p style={{ margin: '10px 0 0', fontSize: '0.85rem' }}>{activePayment.note}</p>
                </div>
              )}
              {placed.paymentId === 'efectivo' && (
                <div className="pay-details" style={{ textAlign: 'left', marginTop: 18 }}>
                  <p style={{ margin: 0 }}>{activePayment.note}</p>
                </div>
              )}

              <a
                href={`${SITE.whatsappLink}?text=${encodeURIComponent(`Hola Tass Loco 507, acabo de hacer el pedido ${placed.order}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn--red btn--lg"
                style={{ marginTop: 20 }}
              >
                <WhatsappIcon style={{ width: 18, height: 18 }} /> Confirmar por WhatsApp
              </a>
              <div style={{ marginTop: 16 }}>
                <Link href="/shop" className="btn btn--ghost">Volver a la tienda</Link>
              </div>
              <p style={{ marginTop: 20, fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                Demo de diseño — la conexión con backend/pagos se integra en la siguiente fase.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state__icon">🛒</div>
            <h2>No hay nada que pagar</h2>
            <p>Agrega productos al carrito antes de pasar al checkout.</p>
            <Link href="/shop" className="btn btn--red btn--lg" style={{ marginTop: 8 }}>Ir a la tienda</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Checkout <span>//</span> Pago
          </h1>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container checkout">
          <form onSubmit={handleSubmit}>
            <div className="checkout__card">
              <h2><span className="num">1</span> Contacto</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" name="nombre" required placeholder="Tu nombre" />
                </div>
                <div className="form-field">
                  <label htmlFor="apellido">Apellido</label>
                  <input id="apellido" name="apellido" placeholder="Tu apellido" />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Correo</label>
                  <input id="email" name="email" type="email" placeholder="tucorreo@email.com" />
                </div>
                <div className="form-field">
                  <label htmlFor="tel">Teléfono / WhatsApp</label>
                  <input id="tel" name="tel" type="tel" required placeholder="+507 6XXX-XXXX" />
                </div>
                <div className="form-field form-field--full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      name="createAccount"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                    />
                    Crear una cuenta (para seguir tus pedidos)
                  </label>
                  {createAccount && (
                    <input
                      type="password"
                      name="password"
                      minLength={6}
                      placeholder="Contraseña (mín. 6 caracteres)"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="checkout__card">
              <h2><span className="num">2</span> Entrega</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {(
                  [
                    { id: 'envio', label: 'Envío a domicilio' },
                    { id: 'recoger', label: 'Recoger en tienda' },
                  ] as { id: Delivery; label: string }[]
                ).map((o) => (
                  <label
                    key={o.id}
                    className={`chip ${delivery === o.id ? 'chip--active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={o.id}
                      checked={delivery === o.id}
                      onChange={() => setDelivery(o.id)}
                      style={{ display: 'none' }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
              {delivery === 'envio' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="provincia">Provincia</label>
                    <select id="provincia" name="provincia" defaultValue={PROVINCIAS[0]}>
                      {PROVINCIAS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="ciudad">Ciudad / Distrito</label>
                    <input id="ciudad" name="ciudad" required placeholder="Ciudad" />
                  </div>
                  <div className="form-field form-field--full">
                    <label htmlFor="direccion">Dirección</label>
                    <input id="direccion" name="direccion" required placeholder="Calle, casa, edificio, corregimiento…" />
                  </div>
                  <div className="form-field form-field--full">
                    <label htmlFor="ref">Referencia (opcional)</label>
                    <input id="ref" name="ref" placeholder="Punto de referencia" />
                  </div>
                </div>
              )}
              {delivery === 'recoger' && (
                <p className="lead" style={{ margin: 0 }}>
                  Coordinaremos el punto y horario de entrega por WhatsApp después de confirmar tu pedido.
                </p>
              )}
            </div>

            <div className="checkout__card">
              <h2><span className="num">3</span> Método de pago</h2>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className={`pay-option ${payment === m.id ? 'pay-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                  />
                  <div>
                    <div className="pay-option__name">{m.name}</div>
                    <div className="pay-option__desc">{m.description}</div>
                    {payment === m.id && m.details.length > 0 && (
                      <div className="pay-details">
                        {m.details.map((d) => (
                          <div className="pay-details__row" key={d.label}>
                            <span>{d.label}</span>
                            <b>{d.value}</b>
                          </div>
                        ))}
                        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--gray-700)' }}>{m.note}</p>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div>
                <p className="admin-login__error">{error}</p>
                {loginRequired && (
                  <Link href="/login" className="btn btn--black btn--sm" style={{ marginTop: 8 }}>
                    Iniciar sesión
                  </Link>
                )}
              </div>
            )}
            <button type="submit" className="btn btn--red btn--block btn--lg" disabled={submitting}>
              {submitting ? 'Enviando…' : `Confirmar pedido · ${formatMoney(subtotal)}`}
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 12 }}>
              No se procesa pago en línea: se registra tu pedido y coordinamos el pago por
              transferencia o efectivo.
            </p>
          </form>

          <div className="summary">
            <h2>Tu pedido</h2>
            {items.map((item) => (
              <div className="summary__row" key={item.slug}>
                <span>{item.name} × {item.qty}</span>
                <span>{formatMoney(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="summary__row">
              <span>Envío</span>
              <span style={{ color: 'var(--gray-500)' }}>A coordinar</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Total</span>
              <span className="amount">{formatMoney(subtotal)}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
