import { Marquee } from '@/components/Marquee';
import { SITE } from '@/lib/site';
import { WhatsappIcon } from '@/components/Icons';

export const metadata = { title: 'Sobre Nosotros' };

export default function SobreNosotrosPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Sobre <span>Nosotros</span>
          </h1>
          <p>{SITE.tagline} — hechos en Panamá.</p>
        </div>
      </section>

      <section className="section">
        <div className="container prose">
          <h2>La cultura del carro, en un solo lugar</h2>
          <p>
            <strong>Tass Loco 507</strong> nació de la pasión por los autos, el tuning y la cultura
            street de Panamá. Somos una tienda dedicada a conseguir piezas de auto, accesorios
            racing y ropa con identidad para la gente que vive y respira carros.
          </p>
          <p>
            Desde spoilers, lips, viseras, side skirts, tuercas y halógenas hasta gorras, suéteres,
            beanies y stickers: traemos lo que tu ride necesita para verse y andar <em>loco</em>.
          </p>
          <h3>¿Por qué Tass Loco 507?</h3>
          <ul>
            <li>Piezas seleccionadas y de buena calidad.</li>
            <li>Envíos a todo Panamá.</li>
            <li>Pago fácil: transferencia bancaria o efectivo.</li>
            <li>Atención directa por WhatsApp.</li>
            <li>Pedidos especiales: si no lo tenemos, te lo conseguimos.</li>
          </ul>
          <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" className="btn btn--red btn--lg" style={{ marginTop: 12 }}>
            <WhatsappIcon style={{ width: 18, height: 18 }} /> Hablemos
          </a>
        </div>
      </section>

      <Marquee items={['PANAMÁ 507', 'TUNING', 'RACING', 'STREETWEAR', 'JDM', 'TASS LOCO 507']} />
    </>
  );
}
