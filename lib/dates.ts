// Formato de fechas: día/mes/año (DD/MM/YYYY).

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
