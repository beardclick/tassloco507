import Link from 'next/link';

export const metadata = { title: 'Lista de Deseos' };

export default function WishlistPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>
            Lista de <span>Deseos</span>
          </h1>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state__icon">⭐</div>
            <h2>Favoritos</h2>
            <p>Guarda tus piezas favoritas para encontrarlas rápido. Esta sección se activará con tu cuenta.</p>
            <Link href="/shop" className="btn btn--red btn--lg" style={{ marginTop: 8 }}>Explorar tienda</Link>
          </div>
        </div>
      </section>
    </>
  );
}
