import type { MetadataRoute } from 'next';
import { categorySlugPath, loadCategories, loadProducts } from '@/lib/catalog';
import { SITE } from '@/lib/site';

// El sitemap se regenera una vez al día; el admin lo invalida al guardar.
export const revalidate = 86400;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE.url}/`, priority: 1 },
  { url: `${SITE.url}/shop`, priority: 0.9 },
  { url: `${SITE.url}/sobre-nosotros`, priority: 0.5 },
  { url: `${SITE.url}/faq`, priority: 0.5 },
  { url: `${SITE.url}/contacto`, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([loadProducts(), loadCategories()]);

  const categoryUrls: MetadataRoute.Sitemap = [];
  for (const category of categories) {
    const path = await categorySlugPath(category);
    categoryUrls.push({
      url: `${SITE.url}/categoria-producto/${path.join('/')}`,
      priority: 0.7,
    });
  }

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE.url}/producto/${product.slug}`,
    lastModified: product.createdAt ? new Date(product.createdAt) : undefined,
    priority: 0.8,
  }));

  return [...STATIC_PAGES, ...categoryUrls, ...productUrls];
}
