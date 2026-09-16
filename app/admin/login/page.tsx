'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/admin');
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
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <div className="admin__brand">
          TASS LOCO <span>507</span>
          <small>Acceso administrador</small>
        </div>

        <div className="form-field">
          <label htmlFor="user">Usuario</label>
          <input
            id="user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="admin-login__error">{error}</p>}

        <button className="btn btn--red btn--block btn--lg" type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
