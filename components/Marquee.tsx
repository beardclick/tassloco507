export function Marquee({ items, speedDesktop = 32, speedMobile = 22 }: { items: string[]; speedDesktop?: number; speedMobile?: number }) {
  const safeItems = items.filter((item) => item.trim());
  const source = safeItems.length > 0 ? safeItems : ['TASS LOCO 507'];
  const filledItems = Array.from(
    { length: Math.max(source.length, 12) },
    (_, index) => source[index % source.length],
  );
  const renderGroup = (group: number) => (
    <span className="marquee__group" aria-hidden={group === 1}>
      {filledItems.map((item, index) => (
        <span className="marquee__item" key={`${group}-${index}`}>
          {item} <span className="star">★</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="marquee" aria-hidden style={{ '--marquee-speed-desktop': `${speedDesktop}s`, '--marquee-speed-mobile': `${speedMobile}s` } as CSSProperties}>
      <div className="marquee__track">
        {renderGroup(0)}
        {renderGroup(1)}
      </div>
    </div>
  );
}
import type { CSSProperties } from 'react';
