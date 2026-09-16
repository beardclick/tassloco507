import Link from 'next/link';

function pageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '…')[] = [1];
  if (page > 3) pages.push('…');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 && (
        <Link className="pagination__btn" href={hrefForPage(page - 1)}>
          ‹ Anterior
        </Link>
      )}
      {pageNumbers(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="pagination__ellipsis">
            …
          </span>
        ) : (
          <Link
            key={p}
            className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
            href={hrefForPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link className="pagination__btn" href={hrefForPage(page + 1)}>
          Siguiente ›
        </Link>
      )}
    </nav>
  );
}
