import { LeadForm } from '@/components/LeadForm';
import { Marquee } from '@/components/Marquee';

export const metadata = { title: 'Cotiza tu pieza' };

export default function RequestQuotePage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Cotiza tu <span>pieza</span>
          </h1>
          <p>¿No la ves en la tienda? Te la conseguimos. Pedidos especiales para tu carro.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <LeadForm
            heading="Cuéntanos qué buscas"
            extraField={{
              label: 'Pieza / producto que buscas',
              placeholder: 'Ej: spoiler para Honda Civic 2016, tuercas Volk Racing…',
            }}
          />
          <p className="lead" style={{ marginTop: 16 }}>
            Incluye marca, modelo y año de tu carro para darte una cotización exacta.
          </p>
        </div>
      </section>

      <Marquee items={['PEDIDOS ESPECIALES', 'JDM', 'RACING', 'PANAMÁ', 'TASS LOCO 507']} />
    </>
  );
}
