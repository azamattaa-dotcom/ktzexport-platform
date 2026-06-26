import { defineRouting } from 'next-intl/routing';

export const locales = ['ru', 'kk', 'en', 'zh', 'tr'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'ru',
  localeDetection: true,
});
