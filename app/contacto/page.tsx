import { LeadForm } from '@/components/LeadForm';
import { SITE } from '@/lib/site';
import { InstagramIcon, MailIcon, MapPinIcon, WhatsappIcon, YoutubeIcon } from '@/components/Icons';

export const metadata = { title: 'Contacto' };

export default function ContactoPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Contácta<span>nos</span>
          </h1>
          <p>¿Dudas, pedidos o cotizaciones? Escríbenos.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div>
            <div className="contact-block" style={{ marginBottom: 16 }}>
              <h3>Estamos en Panamá 🇵🇦</h3>
              <p style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <MapPinIcon style={{ width: 18, height: 18, color: 'var(--red)' }} /> Ciudad de Panamá
              </p>
              <p style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <MailIcon style={{ width: 18, height: 18, color: 'var(--red)' }} /> {SITE.email}
              </p>
              <p style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <WhatsappIcon style={{ width: 18, height: 18, color: 'var(--red)' }} /> {SITE.whatsapp}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <a href={SITE.instagram} target="_blank" rel="noreferrer" className="icon-btn" aria-label="Instagram">
                  <InstagramIcon />
                </a>
                <a href={SITE.youtube} target="_blank" rel="noreferrer" className="icon-btn" aria-label="YouTube">
                  <YoutubeIcon />
                </a>
                <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" className="icon-btn" aria-label="WhatsApp">
                  <WhatsappIcon />
                </a>
              </div>
            </div>
            <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" className="btn btn--black btn--lg">
              <WhatsappIcon style={{ width: 18, height: 18 }} /> WhatsApp directo
            </a>
          </div>

          <LeadForm heading="Escríbenos" />
        </div>
      </section>
    </>
  );
}
