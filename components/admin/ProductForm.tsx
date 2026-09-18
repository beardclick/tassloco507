'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/catalog';
import type { CategoryOption } from '@/lib/admin';
import { GalleryEditor } from './GalleryEditor';

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(
    product ? String((Number(product.prices.price) / 100).toFixed(2)) : '',
  );
  const [regularPrice, setRegularPrice] = useState(
    product?.on_sale
      ? String((Number(product.prices.regular_price) / 100).toFixed(2))
      : '',
  );
  const [onSale, setOnSale] = useState(product?.on_sale ?? false);
  const [inStock, setInStock] = useState(product?.in_stock ?? true);
  const [draft, setDraft] = useState(product?.draft ?? false);
  const [quoteOnly, setQuoteOnly] = useState(product?.quoteOnly ?? false);
  const [hidePrice, setHidePrice] = useState(product?.hidePrice ?? false);
  const [sku, setSku] = useState(product?.sku ?? '');
  const [images, setImages] = useState<string[]>(
    product ? product.images.map((i) => i.src) : [],
  );
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [tags, setTags] = useState((product?.tags ?? []).join(', '));
  const [categoryIds, setCategoryIds] = useState<number[]>(
    product ? product.categories.map((c) => c.id) : [],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleCategory(id: number) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name,
      price: Number(price) || 0,
      regularPrice: regularPrice ? Number(regularPrice) : undefined,
      onSale,
      inStock,
      draft,
      quoteOnly,
      hidePrice,
      sku,
      images,
      shortDescription,
      description,
      tags,
      categoryIds,
    };
    try {
      const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push('/admin/productos');
        router.refresh();
      } else {
        setError(data.error || 'No se pudo guardar');
        setSaving(false);
      }
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="admin-card">
        <h2 className="admin-card__title">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="form-grid">
          <div className="form-field form-field--full">
            <label htmlFor="pf-name">Nombre</label>
            <input id="pf-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="pf-price">Precio (USD)</label>
            <input
              id="pf-price"
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="form-field">
            <label htmlFor="pf-regular">Precio regular (para oferta)</label>
            <input
              id="pf-regular"
              type="number"
              step="0.01"
              min="0"
              value={regularPrice}
              onChange={(e) => setRegularPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="form-field">
            <label htmlFor="pf-sku">SKU</label>
            <input id="pf-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="form-field form-field--full">
            <label>Imágenes — la primera es la destacada</label>
            <GalleryEditor images={images} onChange={setImages} />
          </div>

          <div className="form-field form-field--full" style={{ flexDirection: 'row', gap: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={onSale}
                onChange={(e) => setOnSale(e.target.checked)}
              />
              En oferta
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />
              En stock
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
              />
              Borrador (ocultar de la tienda)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={quoteOnly}
                onChange={(e) => setQuoteOnly(e.target.checked)}
              />
              Solo WhatsApp (sin carrito)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={hidePrice}
                onChange={(e) => setHidePrice(e.target.checked)}
              />
              Ocultar precio
            </label>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="pf-short">Descripción corta</label>
            <textarea
              id="pf-short"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="pf-desc">Descripción completa (HTML)</label>
            <textarea
              id="pf-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="pf-tags">Etiquetas (separadas por coma)</label>
            <input id="pf-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
        </div>

        <div className="admin-cats">
          <p className="admin-cats__label">Categorías</p>
          <div className="admin-cats__grid">
            {categories.map((c) => (
              <label
                key={c.id}
                className={`admin-cat ${categoryIds.includes(c.id) ? 'admin-cat--on' : ''}`}
                style={{ paddingLeft: 12 + c.depth * 16 }}
              >
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="admin-login__error">{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="btn btn--red" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => router.push('/admin/productos')}
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
