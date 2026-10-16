import { NextResponse } from 'next/server';

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readJsonObject(req: Request, maxBytes = 32 * 1024): Promise<Record<string, unknown>> {
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestError('Se requiere JSON.', 415);
  }
  const bytes = await readBodyBytes(req, maxBytes);
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required');
    return parsed;
  } catch {
    throw new RequestError('JSON inválido.');
  }
}

export async function readBodyBytes(req: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError('Solicitud vacía.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestError('Solicitud demasiado grande.', 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('JSON inválido.');
  } finally {
    reader.releaseLock();
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof RequestError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  // No devolver errores internos ni datos de configuración al navegador.
  return NextResponse.json({ ok: false, error: 'Servicio temporalmente no disponible. Inténtalo más tarde.' }, { status: 503 });
}

export function textField(value: unknown, max: number, required = false): string {
  if (value !== undefined && typeof value !== 'string') throw new RequestError('Campo inválido.');
  const text = (value ?? '').toString().trim();
  if (text.length > max || (required && !text)) throw new RequestError('Revisa los campos obligatorios y su longitud.');
  return text;
}

export function passwordField(value: unknown, minimum = 1): string {
  if (typeof value !== 'string' || value.length < minimum || value.length > 256) {
    throw new RequestError(`La contraseña debe tener entre ${minimum} y 256 caracteres.`);
  }
  return value;
}

export function emailField(value: unknown): string {
  const email = textField(value, 254, true).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new RequestError('Correo no válido.');
  return email;
}
