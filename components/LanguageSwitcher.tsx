'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';

const LANG_LABELS: Record<Locale, string> = {
  ru: 'RU', kk: 'KZ', en: 'EN', zh: '中', tr: 'TR',
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            loc === locale
              ? 'bg-primary-700 text-white'
              : 'text-primary-700 hover:bg-primary-50'
          }`}
        >
          {LANG_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
