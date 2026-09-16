export const metadata = { title: 'Preguntas Frecuentes' };

const FAQS = [
  {
    q: '¿Hacen envíos a todo Panamá?',
    a: 'Sí. Hacemos envíos a nivel nacional. Al finalizar tu compra coordinamos la zona, el costo y el tiempo de entrega por WhatsApp.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos transferencia bancaria y efectivo (pago contra entrega). Pronto integraremos más opciones.',
  },
  {
    q: '¿Cómo hago una transferencia bancaria?',
    a: 'Al elegir “Transferencia Bancaria” en el checkout verás los datos de la cuenta. Haz el depósito y envíanos el comprobante por WhatsApp para despachar tu pedido.',
  },
  {
    q: '¿Puedo pagar en efectivo?',
    a: 'Sí, con el método “Efectivo” pagas al recibir tu pedido. Aplican zonas de entrega dentro de Panamá.',
  },
  {
    q: '¿Trabajan pedidos especiales?',
    a: 'Sí. Si buscas una pieza que no ves en la tienda, escríbenos por WhatsApp o usa “Cotiza tu pieza” y te la conseguimos.',
  },
  {
    q: '¿Los productos tienen garantía?',
    a: 'Las piezas se revisan antes del despacho. Si tienes algún problema, contáctanos de inmediato y lo resolvemos.',
  },
  {
    q: '¿Cómo sé si una pieza le sirve a mi carro?',
    a: 'Cada producto indica los modelos y años compatibles. Si tienes dudas, mándanos el modelo de tu carro por WhatsApp y te confirmamos.',
  },
  {
    q: '¿Puedo devolver o cambiar un producto?',
    a: 'Aceptamos cambios en productos sin uso dentro de un plazo razonable. Escríbenos para coordinar.',
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Preguntas <span>Frecuentes</span>
          </h1>
          <p>Todo lo que necesitas saber antes de comprar.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <div className="faq-item__body">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
