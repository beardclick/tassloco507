// Función pura compartida por middleware y pruebas.
export function isTrustedMutation(req: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return true;
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const expected = new URL(process.env.APP_ORIGIN || req.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}
