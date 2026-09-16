'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SearchIcon } from './Icons';

export function SearchBar({
  initialValue = '',
  onDone,
  placeholder = 'Buscar piezas, ropa, marcas…',
}: {
  initialValue?: string;
  onDone?: () => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialValue);

  return (
    <form
      className="searchbar"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
        onDone?.();
      }}
    >
      <SearchIcon />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
      />
    </form>
  );
}
