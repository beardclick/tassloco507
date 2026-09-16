'use client';

import { useRef, useState } from 'react';
import { MediaLibraryModal } from './MediaLibraryModal';

export function ImagePicker({
  value,
  onChange,
  recommended,
}: {
  value: string;
  onChange: (url: string) => void;
  recommended?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo subir la imagen');
      onChange(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value && (
        <div className="single-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Vista previa" />
          <button type="button" className="admin-link admin-link--danger" onClick={() => onChange('')}>
            Quitar imagen
          </button>
        </div>
      )}
      <div
        className={`gallery-drop ${dragging ? 'gallery-drop--over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click();
        }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
      >
        <p>{uploading ? 'Subiendo…' : 'Arrastra una imagen aquí o haz clic para escogerla'}</p>
        {recommended && <small className="admin-muted">{recommended}</small>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = '';
          }}
        />
      </div>
      <button type="button" className="btn btn--ghost btn--sm image-picker__gallery" onClick={() => setMediaOpen(true)}>
        Escoger desde la galería
      </button>
      {error && <p className="admin-login__error">{error}</p>}
      {mediaOpen && (
        <MediaLibraryModal
          onClose={() => setMediaOpen(false)}
          onSelect={(url) => { onChange(url); setMediaOpen(false); }}
        />
      )}
    </div>
  );
}
