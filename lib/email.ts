import { Resend } from 'resend';
import type { Order } from './db';
import { formatMoney } from './money';
import { SITE } from './site';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || 'Tass Loco 507 <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c];
  });
}

function itemsHtml(order: Order): string {
  return order.items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${esc(it.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatMoney(it.price * it.qty)}</td>
        </tr>`,
    )
    .join('');
}

function layout(title: string, body: string): string {
  return `
  <div style="background:#faf9f7;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #0b0b0b;border-radius:12px;overflow:hidden;">
      <div style="background:#0b0b0b;color:#fff;padding:16px 20px;">
        <span style="font-weight:800;font-size:18px;">TASS LOCO <span style="color:#dd3333;">507</span></span>
        <div style="font-size:12px;color:#aaa;">Fashion · Car · Racing</div>
      </div>
      <div style="padding:24px 20px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#0b0b0b;">${title}</h1>
        ${body}
      </div>
      <div style="background:#f2f0ee;padding:14px 20px;font-size:12px;color:#666;border-top:1px solid #eee;">
        ${SITE.name} · ${SITE.country} · ${esc(SITE.email)}
      </div>
    </div>
  </div>`;
}

export async function sendOrderEmails(order: Order): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const jobs: Promise<unknown>[] = [];

  if (order.customer.email) {
    const html = layout(
      `Tu pedido ${order.number} está confirmado`,
      `
      <p style="margin:0 0 14px;color:#333;">¡Gracias por tu compra, ${esc(order.customer.nombre)}!</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Producto</th>
            <th style="padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Cant.</th>
            <th style="text-align:right;padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml(order)}</tbody>
      </table>
      <p style="margin:14px 0 0;text-align:right;font-size:16px;font-weight:800;color:#0b0b0b;">
        Total: <span style="color:#dd3333;">${formatMoney(order.total)}</span>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#555;">
        Pago: <strong>${order.payment.method === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo (contra entrega)'}</strong>.
        Te contactaremos por WhatsApp para coordinar el pago y la entrega.
      </p>`,
    );
    jobs.push(
      resend.emails.send({
        from: FROM,
        to: order.customer.email,
        subject: `Tu pedido ${order.number} está confirmado`,
        html,
      }),
    );
  }

  if (ADMIN_EMAIL) {
    const html = layout(
      `Nuevo pedido ${order.number}`,
      `
      <p style="margin:0 0 14px;color:#333;">
        Cliente: <strong>${esc(order.customer.nombre)} ${esc(order.customer.apellido)}</strong><br/>
        Teléfono: ${esc(order.customer.telefono || '—')}<br/>
        Correo: ${esc(order.customer.email || '—')}<br/>
        Pago: ${order.payment.method === 'transferencia' ? 'Transferencia' : 'Efectivo'}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Producto</th>
            <th style="padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Cant.</th>
            <th style="text-align:right;padding-bottom:6px;border-bottom:2px solid #0b0b0b;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml(order)}</tbody>
      </table>
      <p style="margin:14px 0 0;text-align:right;font-size:16px;font-weight:800;color:#0b0b0b;">
        Total: <span style="color:#dd3333;">${formatMoney(order.total)}</span>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#555;">
        Revisa y confirma el pedido desde el panel admin.
      </p>`,
    );
    jobs.push(
      resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `Nuevo pedido ${order.number} — ${esc(order.customer.nombre)}`,
        html,
      }),
    );
  }

  await Promise.allSettled(jobs);
}
