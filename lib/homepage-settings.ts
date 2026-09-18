import 'server-only';

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabase, STORAGE_BUCKET } from '@/lib/supabase';
import { SITE } from '@/lib/site';

export interface HomepageSettings {
  heroImage: string;
  eyebrowTag: string;
  eyebrowText: string;
  titleFirst: string;
  titleAccent: string;
  titleLast: string;
  tagline: string;
  description: string;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
  stickers: string[];
  topLeftBadge: string;
  bottomRightBadge: string;
  categoriesTag: string;
  categoriesTitle: string;
  autopartsTag: string;
  autopartsTitle: string;
  streetwearTag: string;
  streetwearTitle: string;
  featuredTag: string;
  featuredTitle: string;
  marqueeItems: string[];
  marqueeSpeedDesktop: number;
  marqueeSpeedMobile: number;
  quoteTitle: string;
  quoteDescription: string;
  quotePrimaryLabel: string;
  quotePrimaryHref: string;
  quoteSecondaryLabel: string;
  quoteSecondaryHref: string;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroImage:
    'https://adgmizcnlusgxbflengu.supabase.co/storage/v1/object/public/product-images/legacy/7d61ce935c15cded94c118dae0d8a9e667790e8d.jpeg',
  eyebrowTag: '🇵🇦 PANAMÁ',
  eyebrowText: 'Street Shop',
  titleFirst: 'TASS',
  titleAccent: 'LOCO',
  titleLast: '507',
  tagline: 'Fashion · Car · Racing',
  description:
    'Piezas de auto, accesorios racing y ropa con flow. Todo para tu ride, en todo Panamá.',
  primaryButtonLabel: 'Ver tienda',
  primaryButtonHref: '/shop',
  secondaryButtonLabel: 'Auto Parts',
  secondaryButtonHref: '/categoria-producto/auto-parts',
  stickers: ['ENVÍOS A TODO PANAMÁ', 'STREET · RACING', '#TASSLOCO507'],
  topLeftBadge: 'Fresh 🔥',
  bottomRightBadge: 'Panamá 507',
  categoriesTag: 'Categorías',
  categoriesTitle: '¿Qué buscas?',
  autopartsTag: 'Auto Parts',
  autopartsTitle: 'Piezas & Racing',
  streetwearTag: 'Streetwear',
  streetwearTitle: 'Ropa & Gorras',
  featuredTag: 'Lo más nuevo',
  featuredTitle: 'Recién llegado',
  marqueeSpeedDesktop: 32,
  marqueeSpeedMobile: 22,
  quoteTitle: '¿No encuentras tu pieza?',
  quoteDescription: 'Cotiza piezas especiales o a tu medida. Te conseguimos lo que tu carro necesita.',
  quotePrimaryLabel: 'Cotizar pieza',
  quotePrimaryHref: '/request-quote',
  quoteSecondaryLabel: 'WhatsApp',
  quoteSecondaryHref: SITE.whatsappLink,
  marqueeItems: [
    'FASHION',
    'CAR',
    'RACING',
    'ENVÍOS A TODO PANAMÁ',
    'PIEZAS DE AUTO',
    'ROPA STREETWEAR',
    'TASS LOCO 507',
  ],
};

const settingsPath = path.join(process.cwd(), 'data', 'homepage.json');
const remoteSettingsPath = 'settings/homepage.json';

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function cleanSettings(value: Partial<HomepageSettings>): HomepageSettings {
  const heroImage = String(value.heroImage ?? '').trim();
  const text = <K extends keyof HomepageSettings>(key: K) => {
    const cleaned = String(value[key] ?? '').trim();
    return cleaned || String(DEFAULT_HOMEPAGE_SETTINGS[key]);
  };
  const stickers = Array.isArray(value.stickers)
    ? value.stickers.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];
  const marqueeItems = Array.isArray(value.marqueeItems)
    ? value.marqueeItems.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
    : [];
  const speed = (key: 'marqueeSpeedDesktop' | 'marqueeSpeedMobile') => {
    const n = Number(value[key]);
    return Number.isFinite(n) ? Math.min(180, Math.max(5, n)) : DEFAULT_HOMEPAGE_SETTINGS[key];
  };

  return {
    heroImage: heroImage || DEFAULT_HOMEPAGE_SETTINGS.heroImage,
    eyebrowTag: text('eyebrowTag'),
    eyebrowText: text('eyebrowText'),
    titleFirst: text('titleFirst'),
    titleAccent: text('titleAccent'),
    titleLast: text('titleLast'),
    tagline: text('tagline'),
    description: text('description'),
    primaryButtonLabel: text('primaryButtonLabel'),
    primaryButtonHref: text('primaryButtonHref'),
    secondaryButtonLabel: text('secondaryButtonLabel'),
    secondaryButtonHref: text('secondaryButtonHref'),
    stickers: stickers.length > 0 ? stickers : DEFAULT_HOMEPAGE_SETTINGS.stickers,
    topLeftBadge: text('topLeftBadge'),
    bottomRightBadge: text('bottomRightBadge'),
    categoriesTag: text('categoriesTag'),
    categoriesTitle: text('categoriesTitle'),
    autopartsTag: text('autopartsTag'),
    autopartsTitle: text('autopartsTitle'),
    streetwearTag: text('streetwearTag'),
    streetwearTitle: text('streetwearTitle'),
    featuredTag: text('featuredTag'),
    featuredTitle: text('featuredTitle'),
    marqueeItems:
      marqueeItems.length > 0 ? marqueeItems : DEFAULT_HOMEPAGE_SETTINGS.marqueeItems,
    marqueeSpeedDesktop: speed('marqueeSpeedDesktop'),
    marqueeSpeedMobile: speed('marqueeSpeedMobile'),
    quoteTitle: text('quoteTitle'),
    quoteDescription: text('quoteDescription'),
    quotePrimaryLabel: text('quotePrimaryLabel'),
    quotePrimaryHref: text('quotePrimaryHref'),
    quoteSecondaryLabel: text('quoteSecondaryLabel'),
    quoteSecondaryHref: text('quoteSecondaryHref'),
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabase().storage
        .from(STORAGE_BUCKET)
        .download(remoteSettingsPath);
      if (!error && data) return cleanSettings(JSON.parse(await data.text()) as Partial<HomepageSettings>);
    } catch {
      // Durante el primer despliegue todavía puede no existir el objeto remoto.
    }
  }
  try {
    const raw = await readFile(settingsPath, 'utf8');
    return cleanSettings(JSON.parse(raw) as Partial<HomepageSettings>);
  } catch {
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}

export async function saveHomepageSettings(
  value: Partial<HomepageSettings>,
): Promise<HomepageSettings> {
  const settings = cleanSettings(value);
  if (hasSupabaseConfig()) {
    const { error } = await getSupabase().storage.from(STORAGE_BUCKET).upload(
      remoteSettingsPath,
      JSON.stringify(settings),
      { upsert: true, contentType: 'application/json', cacheControl: '0' },
    );
    if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);
    return settings;
  }
  const temporaryPath = `${settingsPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, settingsPath);
  return settings;
}
