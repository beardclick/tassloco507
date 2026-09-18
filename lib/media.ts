import 'server-only';

import { getSupabase, STORAGE_BUCKET } from './supabase';
import { getCategories, getProducts } from './db';
import { getHomepageSettings } from './homepage-settings';

export interface MediaItem {
  url: string;
  name: string;
  source: 'subida' | 'producto' | 'categoria' | 'banner';
  label: string;
}

export async function getAllMediaItems(): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const seen = new Set<string>();

  const add = (url: string, name: string, source: MediaItem['source'], label: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({ url, name, source, label });
  };

  // 1) Archivos subidos al Storage.
  try {
    const sb = getSupabase();
    const { data } = await sb.storage.from(STORAGE_BUCKET).list();
    for (const f of data ?? []) {
      if (/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f.name)) {
        const url = sb.storage.from(STORAGE_BUCKET).getPublicUrl(f.name).data.publicUrl;
        add(url, f.name, 'subida', 'Imagen subida');
      }
    }
  } catch {
    // bucket sin acceso / sin imágenes
  }

  // 2) Imágenes de productos.
  try {
    const products = await getProducts(true);
    for (const p of products) {
      for (const img of p.images ?? []) {
        add(img.src, p.name, 'producto', 'Producto');
      }
    }
  } catch {
    // sin productos
  }

  // 3) Imágenes de categorías.
  try {
    const categories = await getCategories();
    for (const c of categories) {
      if (c.image) add(c.image, c.name, 'categoria', 'Categoría');
    }
  } catch {
    // sin categorías
  }

  // 4) Banner / hero del homepage.
  try {
    const homepage = await getHomepageSettings();
    if (homepage.heroImage) add(homepage.heroImage, 'Banner principal', 'banner', 'Banner');
  } catch {
    // sin homepage
  }

  return items;
}
