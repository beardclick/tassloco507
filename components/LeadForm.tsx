'use client';

import { useState } from 'react';
import { SITE } from '@/lib/site';
import { CheckIcon, WhatsappIcon } from './Icons';

export function LeadForm({
  heading,
  extraField,
}: {
  heading?: string;
  extraField?: { label: string; placeholder: string };
}) {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [extra, setExtra] = useState('');
  const [message, setMessage] = useState('');

  if (sent) {
    const text = encodeURIComponent(
      `Hola Tass Loco 507 👋\nNombre: ${name}\nTel: ${phone}${extra ? `\n${extraField?.label}: ${extra}` : ''}\nMensaje: ${message}`,
    );
    return (
      <div className="checkout__card" style={{ textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--black)', color: '#fff', display: 'grid', placeItems: 'center' }}>
          <CheckIcon style={{ width: 30, height: 30 }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>¡Mensaje listo!</h3>
        <p className="lead">Envíanoslo por WhatsApp y te respondemos rápido.</p>
        <a href={`${SITE.whatsappLink}?text=${text}`} target="_blank" rel="noreferrer" className="btn btn--red btn--lg">
          <WhatsappIcon style={{ width: 18, height: 18 }} /> Enviar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      className="checkout__card"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {heading && <h2>{heading}</h2>}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="lf-name">Nombre</label>
          <input id="lf-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div className="form-field">
          <label htmlFor="lf-phone">Teléfono / WhatsApp</label>
          <input id="lf-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+507 6XXX-XXXX" />
        </div>
        {extraField && (
          <div className="form-field form-field--full">
            <label htmlFor="lf-extra">{extraField.label}</label>
            <input id="lf-extra" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={extraField.placeholder} />
          </div>
        )}
        <div className="form-field form-field--full">
          <label htmlFor="lf-msg">Mensaje</label>
          <textarea id="lf-msg" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cuéntanos qué necesitas…" />
        </div>
      </div>
      <button type="submit" className="btn btn--red btn--lg" style={{ marginTop: 16 }}>
        Enviar mensaje
      </button>
    </form>
  );
}
