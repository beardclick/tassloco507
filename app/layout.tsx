import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Archivo, Anton, Bungee, Permanent_Marker } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import { AppChrome } from '@/components/AppChrome';
import { Header, type NavItem } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE } from '@/lib/site';

const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee',
  display: 'swap',
});
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});
const marker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    type: 'website',
  },
};

const NAV: NavItem[] = [
  { name: 'Auto Parts', href: '/categoria-producto/auto-parts' },
  { name: 'Gorras', href: '/categoria-producto/gorras-snapbacks' },
  { name: 'Ropa', href: '/categoria-producto/sueter' },
  { name: 'Accesorios', href: '/categoria-producto/accesorios' },
];

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${bungee.variable} ${anton.variable} ${marker.variable} ${archivo.variable}`}
    >
      <body>
        <CartProvider>
          <AppChrome header={<Header nav={NAV} />} footer={<Footer />}>
            {children}
          </AppChrome>
        </CartProvider>
      </body>
    </html>
  );
}
