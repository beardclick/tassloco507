import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', lineHeight: 1, color: 'var(--red)' }}>
          404
        </div>
        <h1 className="heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', margin: '8px 0' }}>
          Te perdiste en la pista
        </h1>
        <p className="lead">Esa página no existe o se movió.</p>
        <Link href="/" className="btn btn--black btn--lg" style={{ marginTop: 12 }}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
