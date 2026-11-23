import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/login',
          '/registro',
          '/reset-password',
          '/my-account',
          '/cart',
          '/checkout',
          '/wishlist',
          '/request-quote',
          // Evita que los buscadores generen renders infinitos por filtros y paginación.
          '/shop?',
          '/categoria-producto/*?',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
