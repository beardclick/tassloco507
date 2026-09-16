import Link from 'next/link';
import {
  categoryTree,
  featuredProducts,
  getCategoryByPath,
  getCategoryProductCount,
  getProductsForCategory,
} from '@/lib/catalog';
import { Marquee } from '@/components/Marquee';
import { ProductGrid } from '@/components/ProductGrid';
import { ArrowRightIcon, CashIcon, ShieldIcon, TruckIcon, WhatsappIcon } from '@/components/Icons';
import { SITE } from '@/lib/site';
import { getHomepageSettings } from '@/lib/homepage-settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const homepage = await getHomepageSettings();
  const roots = await categoryTree();
  const featured = await featuredProducts(4);
  const autoParts = await getCategoryByPath(['auto-parts']);
  const autoPartsProducts = autoParts ? (await getProductsForCategory(autoParts)).slice(0, 4) : [];
  const gorras = await getCategoryByPath(['gorras-snapbacks']);
  const sueter = await getCategoryByPath(['sueter']);
  const street = [
    ...(gorras ? await getProductsForCategory(gorras) : []),
    ...(sueter ? await getProductsForCategory(sueter) : []),
  ].slice(0, 4);
  const counts = new Map<number, number>();
  for (const c of roots) counts.set(c.id, await getCategoryProductCount(c));

  return (
    <>
      {/* HERO */}
      <section className="hero bg-splatter">
        <div className="container hero__inner">
          <div>
            <span className="hero__eyebrow">
              <span className="tag tag--red">{homepage.eyebrowTag}</span> {homepage.eyebrowText}
            </span>
            <h1 className="hero__title">
              {homepage.titleFirst} <span className="loco">{homepage.titleAccent}</span>
              <br />
              <span className="outline">{homepage.titleLast}</span>
            </h1>
            <p className="hero__tagline">
              {homepage.tagline.split('·').map((part, index, parts) => (
                <span key={`${part}-${index}`}>
                  <b>{part.trim()}</b>{index < parts.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
            <p className="lead" style={{ maxWidth: 460 }}>
              {homepage.description}
            </p>
            <div className="hero__cta">
              <Link href={homepage.primaryButtonHref} className="btn btn--black btn--lg">
                {homepage.primaryButtonLabel} <ArrowRightIcon style={{ width: 18, height: 18 }} />
              </Link>
              <Link href={homepage.secondaryButtonHref} className="btn btn--red btn--lg">
                {homepage.secondaryButtonLabel}
              </Link>
            </div>
            <div className="hero__stickers">
              {homepage.stickers.map((sticker, index) => (
                <span
                  className={`sticker ${index % 2 === 1 ? 'sticker--red sticker--tilt2' : 'sticker--tilt'}`}
                  key={`${sticker}-${index}`}
                >
                  {sticker}
                </span>
              ))}
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={homepage.heroImage} alt="Tass Loco 507" />
            </div>
            <span className="hero__corner hero__corner--tl">{homepage.topLeftBadge}</span>
            <span className="hero__corner hero__corner--br">{homepage.bottomRightBadge}</span>
          </div>
        </div>
      </section>

      <Marquee items={homepage.marqueeItems} />

      {/* FEATURES */}
      <section className="features">
        <div className="container features__grid">
          <div className="feature">
            <div className="feature__icon"><TruckIcon /></div>
            <div>
              <p className="feature__title">Envíos Panamá</p>
              <p className="feature__text">Entregas en todo el país.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon"><CashIcon /></div>
            <div>
              <p className="feature__title">Pago fácil</p>
              <p className="feature__text">Transferencia o efectivo.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon"><ShieldIcon /></div>
            <div>
              <p className="feature__title">Calidad</p>
              <p className="feature__text">Piezas seleccionadas.</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature__icon"><WhatsappIcon /></div>
            <div>
              <p className="feature__title">Atención directa</p>
              <p className="feature__text">Escríbenos por WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="tag tag--red">Categorías</span>
              <h2 className="section-title" style={{ marginTop: 12 }}>¿Qué buscas?</h2>
            </div>
            <Link href="/shop" className="btn btn--ghost">
              Ver todo <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </Link>
          </div>
          <div className="category-grid">
            {roots.map((c) => (
              <Link key={c.id} href={`/categoria-producto/${c.slug}`} className="category-card">
                <div className="category-card__img">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} loading="lazy" />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: '#999' }}>
                      {c.name}
                    </div>
                  )}
                  <span className="category-card__count">{counts.get(c.id) ?? 0}</span>
                </div>
                <div className="category-card__body">
                  <h3 className="category-card__name">{c.name}</h3>
                  <span className="category-card__link">Explorar →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AUTO PARTS */}
      <section className="section" style={{ background: 'var(--paper-2)', borderTop: '2px solid var(--black)', borderBottom: '2px solid var(--black)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="tag">Auto Parts</span>
              <h2 className="section-title" style={{ marginTop: 12 }}>Piezas & Racing</h2>
            </div>
            <Link href="/categoria-producto/auto-parts" className="btn btn--red">
              Ver Auto Parts <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </Link>
          </div>
          <ProductGrid products={autoPartsProducts} />
        </div>
      </section>

      {/* STREETWEAR */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="tag tag--red">Streetwear</span>
              <h2 className="section-title" style={{ marginTop: 12 }}>Ropa & Gorras</h2>
            </div>
            <Link href="/categoria-producto/gorras-snapbacks" className="btn btn--black">
              Ver Ropa <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </Link>
          </div>
          <ProductGrid products={street} />
        </div>
      </section>

      {/* FEATURED */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ marginBottom: 28 }}>
            <span className="tag">Lo más nuevo</span>
            <h2 className="section-title" style={{ marginTop: 12 }}>Recién llegado</h2>
          </div>
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stripes-red" style={{ padding: '48px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center' }}>
          <h2 className="heading" style={{ color: '#fff', fontSize: 'clamp(1.8rem,4vw,3rem)', margin: 0 }}>
            ¿No encuentras tu pieza?
          </h2>
          <p style={{ color: '#fff', margin: 0, maxWidth: 520 }}>
            Cotiza piezas especiales o a tu medida. Te conseguimos lo que tu carro necesita.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/request-quote" className="btn btn--black btn--lg">
              Cotizar pieza
            </Link>
            <a href={SITE.whatsappLink} target="_blank" rel="noreferrer" className="btn btn--ghost btn--lg">
              <WhatsappIcon style={{ width: 18, height: 18 }} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
