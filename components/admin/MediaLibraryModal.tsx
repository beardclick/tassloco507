'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaItem {
  url: string;
  name: string;
}

export function MediaLibraryModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    await fetch('/api/admin/upload', { method: 'POST', body: fd });
    setUploading(false);
    load();
  }

  return (
    <div className="media-backdrop" onClick={onClose}>
      <div className="media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal__head">
          <h3>Galería de medios</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn--black btn--sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Subiendo…' : '+ Subir'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) upload(e.target.files[0]);
                e.target.value = '';
              }}
            />
            <button className="admin-link admin-link--danger" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="media-modal__grid">
          {loading ? (
            <p className="admin-empty">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="admin-empty">No hay imágenes todavía. Sube la primera.</p>
          ) : (
            items.map((it) => (
              <button key={it.url} className="media-item" onClick={() => onSelect(it.url)} title="Usar esta imagen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.name} loading="lazy" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
