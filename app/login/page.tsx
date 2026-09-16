'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/my-account');
        router.refresh();
      } else {
        setError(data.error || 'No se pudo iniciar sesión');
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
            Iniciar <span>sesión</span>
          </h1>
          <p className="auth-card__sub">Accede a tu cuenta de cliente.</p>
        </div>

        <div className="form-field">
          <label htmlFor="l-email">Correo</label>
          <input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="l-pass">Contraseña</label>
          <input id="l-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="admin-login__error">{error}</p>}

        <button className="btn btn--red btn--block btn--lg" disabled={loading}>
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" style={{ color: 'var(--red)', fontWeight: 700 }}>
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
