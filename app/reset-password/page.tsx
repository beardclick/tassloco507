'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { PasswordInput } from '@/components/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (type === 'recovery' && accessToken && refreshToken) {
      getSupabaseBrowser()
        .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setError(error.message);
            setState('invalid');
          } else {
            setState('ready');
          }
        });
    } else {
      setState('invalid');
      setError('Enlace inválido o expirado. Solicita un nuevo restablecimiento de contraseña.');
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    const { error } = await getSupabaseBrowser().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      setMessage('Contraseña actualizada. Redirigiendo al inicio de sesión…');
      setTimeout(() => router.push('/admin/login'), 1200);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h1>
            Nueva <span>contraseña</span>
          </h1>
          <p className="auth-card__sub">Escribe tu nueva contraseña de administrador.</p>
        </div>

        {state === 'checking' && <p className="admin-muted">Verificando enlace…</p>}

        {state === 'invalid' && (
          <>
            <p className="admin-login__error">{error}</p>
            <a href="/admin/login" className="btn btn--red btn--block btn--lg" style={{ textAlign: 'center' }}>
              Volver al inicio de sesión
            </a>
          </>
        )}

        {state === 'ready' && (
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="rp-pass">Nueva contraseña</label>
              <PasswordInput id="rp-pass" minLength={6} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="rp-confirm">Confirmar contraseña</label>
              <PasswordInput id="rp-confirm" minLength={6} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            {error && <p className="admin-login__error">{error}</p>}
            {message && <p className="admin-muted">{message}</p>}

            <button className="btn btn--red btn--block btn--lg" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
