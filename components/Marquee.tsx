export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {doubled.map((item, i) => (
          <span className="marquee__item" key={i}>
            {item} <span className="star">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
