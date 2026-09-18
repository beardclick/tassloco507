'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function MediaUploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await fetch('/api/admin/upload', { method: 'POST', body: fd });
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <>
      <button className="btn btn--red" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Subiendo…' : '+ Subir imagen'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
    </>
  );
}
