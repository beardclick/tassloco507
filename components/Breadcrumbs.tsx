import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Migas de pan">
      <Link href="/">Inicio</Link>
      {items.map((c, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="sep">›</span>
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}
