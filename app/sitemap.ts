import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { PRODUCT_LIST } from '@/lib/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ktzexport.com';

const STATIC_PATHS = ['', '/products', '/contract', '/logistics', '/suppliers/register', '/buyer/register'];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...STATIC_PATHS, ...PRODUCT_LIST.map((p) => `/products/${p.id}`)];

  return paths.map((path) => ({
    url: `${SITE_URL}/ru${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])),
    },
  }));
}
