'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'newest';

  return (
    <select
      className="sort-select"
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        const value = e.target.value;
        if (value === 'newest') params.delete('sort');
        else params.set('sort', value);
        const qs = params.toString();
        router.push(qs ? `/shop?${qs}` : '/shop');
      }}
      aria-label="Ordenar productos"
    >
      <option value="newest">Más nuevos</option>
      <option value="price-asc">Precio: menor a mayor</option>
      <option value="price-desc">Precio: mayor a menor</option>
      <option value="name">Nombre A-Z</option>
    </select>
  );
}
