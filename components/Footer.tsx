import Link from 'next/link';
import { categoryTree } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import { InstagramIcon, MailIcon, WhatsappIcon, YoutubeIcon } from './Icons';

export function Footer() {
  const roots = categoryTree();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__strip" />
      <div className="container footer__grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SITE.logo} alt="Tass Loco 507" style={{ height: 64, marginBottom: 12 }} />
          <p>
            <strong>{SITE.tagline}</strong>
          </p>
          <p>
            Piezas de auto, accesorios racing y ropa streetwear. Hecho en Panamá con actitud
            <em> loca</em> por los carros.
          </p>
          <div className="footer__social">
            <a href={SITE.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href={SITE.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
              <YoutubeIcon />
            </a>
            <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <WhatsappIcon />
            </a>
          </div>
        </div>

        <div>
          <h4>Categorías</h4>
          {roots.map((c) => (
            <div key={c.id}>
              <Link href={`/categoria-producto/${c.slug}`}>{c.name}</Link>
            </div>
          ))}
          <Link href="/categoria-producto/pedido-especial">Pedido Especial</Link>
        </div>

        <div>
          <h4>Tienda</h4>
          <div><Link href="/shop">Ver todo</Link></div>
          <div><Link href="/cart">Carrito</Link></div>
          <div><Link href="/checkout">Checkout</Link></div>
          <div><Link href="/request-quote">Cotiza tu pieza</Link></div>
          <div><Link href="/sobre-nosotros">Sobre nosotros</Link></div>
          <div><Link href="/faq">Preguntas frecuentes</Link></div>
          <div><Link href="/contacto">Contacto</Link></div>
          <div><Link href="/my-account">Mi cuenta</Link></div>
          <div><Link href="/registro">Registrarse</Link></div>
        </div>

        <div>
          <h4>Contacto</h4>
          <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MailIcon style={{ width: 16, height: 16, color: 'var(--red)' }} /> {SITE.email}
          </p>
          <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <WhatsappIcon style={{ width: 16, height: 16, color: 'var(--red)' }} /> {SITE.whatsapp}
          </p>
          <p>Panamá 🇵🇦</p>
          <div className="tag tag--red" style={{ marginTop: 10 }}>Fashion · Car · Racing</div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <span>© {year} Tass Loco 507. Todos los derechos reservados.</span>
          <span>Pagos: Transferencia bancaria · Efectivo</span>
        </div>
      </div>
    </footer>
  );
}
