// Prueba de envío de correo con Resend.
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.FROM || 'Tass Loco 507 <alertas@tassloco507.com>';
const to = process.env.TO || 'beardclick@gmail.com';

const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: 'Prueba de notificación Tass Loco 507',
  html: '<p>Si recibes esto, la notificación funciona.</p>',
});

console.log('FROM:', from);
console.log('TO:', to);
console.log('DATA:', JSON.stringify(data));
console.log('ERROR:', JSON.stringify(error));
