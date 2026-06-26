import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Map country codes → locale
const countryLocaleMap: Record<string, string> = {
  CN: 'zh', HK: 'zh', TW: 'zh', MO: 'zh',
  TR: 'tr', AZ: 'tr', TM: 'tr',
  KZ: 'ru', RU: 'ru', BY: 'ru', UA: 'ru',
  UZ: 'ru', TJ: 'ru', KG: 'ru', AF: 'ru',
};

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If no locale prefix yet, detect from country header (set by Vercel/Cloudflare)
  const hasLocale = routing.locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );

  if (!hasLocale) {
    const country = request.headers.get('x-vercel-ip-country') ||
                    request.headers.get('cf-ipcountry') || '';
    const detectedLocale = countryLocaleMap[country.toUpperCase()] || null;

    if (detectedLocale && detectedLocale !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${detectedLocale}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
