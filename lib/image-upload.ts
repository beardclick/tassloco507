// No confiar en extensión ni MIME enviados por el navegador; se rechaza SVG activo.
export function detectImage(bytes: Uint8Array): { extension: string; contentType: string } | null {
  const start = Buffer.from(bytes.slice(0, 32));
  if (start.length < 12) return null;
  if (start.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: 'png', contentType: 'image/png' };
  if (start[0] === 255 && start[1] === 216 && start[2] === 255) return { extension: 'jpg', contentType: 'image/jpeg' };
  if (['GIF87a', 'GIF89a'].includes(start.toString('ascii', 0, 6))) return { extension: 'gif', contentType: 'image/gif' };
  if (start.toString('ascii', 0, 4) === 'RIFF' && start.toString('ascii', 8, 12) === 'WEBP') return { extension: 'webp', contentType: 'image/webp' };
  if (start.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(start.toString('ascii', 8, 12))) return { extension: 'avif', contentType: 'image/avif' };
  return null;
}
