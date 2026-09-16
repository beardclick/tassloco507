'use client';

import { useState, type FormEvent } from 'react';
import type { HomepageSettings } from '@/lib/homepage-settings';
import { ImagePicker } from './ImagePicker';

type TextKey = Exclude<keyof HomepageSettings, 'marqueeItems' | 'stickers'>;

export function HomepageSettingsForm({ settings }: { settings: HomepageSettings }) {
  const [content, setContent] = useState(settings);
  const [marquee, setMarquee] = useState(settings.marqueeItems.join('\n'));
  const [stickers, setStickers] = useState(settings.stickers.join('\n'));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const setText = (key: TextKey, value: string) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          stickers: stickers.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          marqueeItems: marquee.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar');
      setContent(data.settings);
      setStickers(data.settings.stickers.join('\n'));
      setMarquee(data.settings.marqueeItems.join('\n'));
      setMessage('Homepage actualizado correctamente.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={handleSubmit}>
      <h2 className="admin-card__title">Imagen del banner</h2>
      <div className="form-field">
        <label htmlFor="hero-image">Foto del hero</label>
        <ImagePicker
          value={content.heroImage}
          onChange={(url) => setText('heroImage', url)}
          recommended="Tamaño recomendado: 1200 px de ancho, formato horizontal."
        />
      </div>

      <h2 className="admin-card__title homepage-settings__section">Textos del hero</h2>
      <div className="form-grid">
        <TextField id="eyebrow-tag" label="Etiqueta superior" value={content.eyebrowTag} onChange={(value) => setText('eyebrowTag', value)} />
        <TextField id="eyebrow-text" label="Texto superior" value={content.eyebrowText} onChange={(value) => setText('eyebrowText', value)} />
        <TextField id="title-first" label="Título — primera palabra" value={content.titleFirst} onChange={(value) => setText('titleFirst', value)} />
        <TextField id="title-accent" label="Título — palabra roja" value={content.titleAccent} onChange={(value) => setText('titleAccent', value)} />
        <TextField id="title-last" label="Título — segunda línea" value={content.titleLast} onChange={(value) => setText('titleLast', value)} />
        <TextField id="tagline" label="Línea Fashion · Car" value={content.tagline} onChange={(value) => setText('tagline', value)} />
        <div className="form-field form-field--full">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" required value={content.description} onChange={(event) => setText('description', event.target.value)} />
        </div>
        <TextField id="top-left-badge" label="Etiqueta sobre imagen" value={content.topLeftBadge} onChange={(value) => setText('topLeftBadge', value)} />
        <TextField id="bottom-right-badge" label="Etiqueta inferior imagen" value={content.bottomRightBadge} onChange={(value) => setText('bottomRightBadge', value)} />
        <div className="form-field form-field--full">
          <label htmlFor="stickers">Stickers</label>
          <textarea id="stickers" required rows={4} value={stickers} onChange={(event) => setStickers(event.target.value)} />
          <small className="admin-muted">Un sticker por línea.</small>
        </div>
      </div>

      <h2 className="admin-card__title homepage-settings__section">Botones</h2>
      <div className="form-grid">
        <TextField id="primary-label" label="Botón principal" value={content.primaryButtonLabel} onChange={(value) => setText('primaryButtonLabel', value)} />
        <TextField id="primary-href" label="Enlace principal" value={content.primaryButtonHref} onChange={(value) => setText('primaryButtonHref', value)} />
        <TextField id="secondary-label" label="Botón secundario" value={content.secondaryButtonLabel} onChange={(value) => setText('secondaryButtonLabel', value)} />
        <TextField id="secondary-href" label="Enlace secundario" value={content.secondaryButtonHref} onChange={(value) => setText('secondaryButtonHref', value)} />
      </div>

      <h2 className="admin-card__title homepage-settings__section">Marquee</h2>
      <div className="form-field">
        <label htmlFor="marquee-items">Contenido del marquee</label>
        <textarea id="marquee-items" required rows={8} value={marquee} onChange={(event) => setMarquee(event.target.value)} />
        <small className="admin-muted">Escribe un mensaje por línea. Puedes dejar solamente uno.</small>
      </div>

      {error && <p className="admin-login__error homepage-settings__notice">{error}</p>}
      {message && <p className="homepage-settings__success">{message}</p>}
      <button className="btn btn--red" disabled={saving}>{saving ? 'Guardando…' : 'Guardar todos los cambios'}</button>
    </form>
  );
}

function TextField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} required value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
