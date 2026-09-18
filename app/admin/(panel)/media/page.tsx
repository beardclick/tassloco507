import { getAllMediaItems } from '@/lib/media';
import { MediaUploadButton } from '@/components/admin/MediaUploadButton';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

const LABELS: Record<string, string> = {
  subida: 'Subida',
  producto: 'Producto',
  categoria: 'Categoría',
  banner: 'Banner',
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const items = await getAllMediaItems();

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const pageItems = items.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function hrefForPage(p: number) {
    return p > 1 ? `/admin/media?page=${p}` : '/admin/media';
  }

  return (
    <div>
      <div className="admin-card__head" style={{ marginBottom: 16 }}>
        <h1 className="admin-title" style={{ margin: 0 }}>
          Media
        </h1>
        <MediaUploadButton />
      </div>

      <p className="admin-muted" style={{ marginBottom: 16 }}>
        {total} imagen{total === 1 ? '' : 'es'}
        {totalPages > 1 ? ` · página ${currentPage} de ${totalPages}` : ''} — subidas, de productos,
        categorías y banners.
      </p>

      {items.length === 0 ? (
        <div className="admin-card">
          <p className="admin-empty">Aún no hay imágenes en la web.</p>
        </div>
      ) : (
        <div className="media-library-grid">
          {pageItems.map((it) => (
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

      <Pagination page={currentPage} totalPages={totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}
