import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function HeroSection() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grain" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="white"/>
              <circle cx="10" cy="10" r="1" fill="white"/>
              <circle cx="50" cy="50" r="1" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grain)"/>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-wheat-400 rounded-full animate-pulse"/>
            {t('badge')}
          </span>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-primary-100 mb-10 leading-relaxed max-w-2xl">
            {t('subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${locale}#products`}
              className="inline-flex items-center justify-center gap-2 bg-wheat-500 hover:bg-wheat-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              {t('ctaBuyer')} →
            </Link>
            <Link
              href={`/${locale}/suppliers/register`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 font-semibold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm"
            >
              {t('ctaSupplier')} →
            </Link>
            <Link
              href={`/${locale}/logistics`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 font-semibold px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm"
            >
              {t('ctaLogistics')} →
            </Link>
          </div>

          {/* Stats — Kazakhstan market data */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { value: '8 млн т',  label: t('stat1') },
              { value: '80+',      label: t('stat2') },
              { value: '$3 млрд',  label: t('stat3') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-wheat-400">{stat.value}</div>
                <div className="text-xs text-primary-200 mt-1 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L1440 60L1440 20C1200 55 960 0 720 30C480 60 240 10 0 40L0 60Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
