export function Marquee({ items }: { items: string[] }) {
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
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {renderGroup(0)}
        {renderGroup(1)}
      </div>
    </div>
  );
}
