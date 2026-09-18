'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '' });
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/my-account');
        router.refresh();
      } else {
        setError(data.error || 'No se pudo registrar');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <h1>
            Crear <span>cuenta</span>
          </h1>
          <p className="auth-card__sub">Regístrate para seguir tus pedidos.</p>
        </div>

        <div className="form-field">
          <label htmlFor="r-nombre">Nombre</label>
          <input id="r-nombre" required value={form.nombre} onChange={set('nombre')} />
        </div>
        <div className="form-field">
          <label htmlFor="r-apellido">Apellido</label>
          <input id="r-apellido" value={form.apellido} onChange={set('apellido')} />
        </div>
        <div className="form-field">
          <label htmlFor="r-email">Correo</label>
          <input id="r-email" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="form-field">
          <label htmlFor="r-tel">Teléfono / WhatsApp</label>
          <input id="r-tel" type="tel" value={form.telefono} onChange={set('telefono')} />
        </div>
        <div className="form-field">
          <label htmlFor="r-pass">Contraseña</label>
          <PasswordInput id="r-pass" required minLength={6} value={form.password} onChange={set('password')} />
        </div>
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {error && <p className="admin-login__error">{error}</p>}

        <button className="btn btn--red btn--block btn--lg" disabled={loading}>
          {loading ? 'Creando…' : 'Registrarme'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--red)', fontWeight: 700 }}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
