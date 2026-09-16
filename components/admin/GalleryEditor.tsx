'use client';

import { useRef, useState } from 'react';
import { MediaLibraryModal } from './MediaLibraryModal';

export function GalleryEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) onChange([...images, data.url]);
      else setError(data.error || 'No se pudo subir');
    } catch {
      setError('Error de conexión');
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setFeatured(index: number) {
    const url = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([url, ...rest]);
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="gallery-editor">
          {images.map((img, i) => (
            <div key={`${img}-${i}`} className={`gallery-thumb ${i === 0 ? 'gallery-thumb--featured' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" />
              {i === 0 && <span className="gallery-thumb__badge">Destacada</span>}
              <div className="gallery-thumb__actions">
                {i !== 0 && (
                  <button onClick={() => setFeatured(i)} title="Marcar como destacada">
                    ★ Destacar
                  </button>
                )}
                <button onClick={() => remove(i)} title="Quitar">
                  ✕ Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`gallery-drop ${dragging ? 'gallery-drop--over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const files = Array.from(e.dataTransfer.files || []);
          files.filter((f) => f.type.startsWith('image/')).forEach(uploadFile);
        }}
      >
        <p>{uploading ? 'Subiendo…' : 'Arrastra imágenes aquí, haz clic o elige de la galería'}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--black btn--sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            Subir imagen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) uploadFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMediaOpen(true)}>
            Galería de medios
          </button>
        </div>
      </div>

      {error && <p className="admin-login__error" style={{ marginTop: 8 }}>{error}</p>}

      {mediaOpen && (
        <MediaLibraryModal
          onClose={() => setMediaOpen(false)}
          onSelect={(url) => {
            onChange([...images, url]);
            setMediaOpen(false);
          }}
        />
      )}
    </div>
  );
}
