import { getAllMediaItems } from '@/lib/media';
import { MediaUploadButton } from '@/components/admin/MediaUploadButton';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  subida: 'Subida',
  producto: 'Producto',
  categoria: 'Categoría',
  banner: 'Banner',
};

export default async function MediaPage() {
  const items = await getAllMediaItems();

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <h1 className="admin-title" style={{ margin: 0 }}>
          Media
        </h1>
        <MediaUploadButton />
      </div>

      <p className="admin-muted" style={{ marginBottom: 16 }}>
        {items.length} imagen{items.length === 1 ? '' : 'es'} — subidas, de productos, categorías y banners.
      </p>

      {items.length === 0 ? (
        <div className="admin-card">
          <p className="admin-empty">Aún no hay imágenes en la web.</p>
        </div>
      ) : (
        <div className="media-library-grid">
          {items.map((it) => (
            <figure className="media-library-item" key={it.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.name} loading="lazy" />
              <figcaption>
                <span className={`media-badge media-badge--${it.source}`}>{LABELS[it.source]}</span>
                <span className="media-library-item__name" title={it.name}>
                  {it.name}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
