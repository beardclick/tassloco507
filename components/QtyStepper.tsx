'use client';

export function QtyStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="qty">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <input type="text" value={value} readOnly aria-label="Cantidad" />
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Aumentar cantidad">
        +
      </button>
    </div>
  );
}
