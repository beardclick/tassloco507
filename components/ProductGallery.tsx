'use client';

import { useState } from 'react';

export function ProductGallery({
  images,
  name,
}: {
  images: { src: string; thumbnail: string; alt: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="pdp__main" style={{ display: 'grid', placeItems: 'center', height: 320 }}>
        <span className="tag">TASS LOCO 507</span>
      </div>
    );
  }

  return (
    <div>
      <div className="pdp__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].src} alt={images[active].alt || name} />
      </div>
      {images.length > 1 && (
        <div className="pdp__thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`pdp__thumb ${i === active ? 'pdp__thumb--active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnail} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
