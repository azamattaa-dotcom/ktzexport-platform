import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">KTZ</span>
              </div>
              <span className="font-bold text-lg">KTZ Export</span>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed">{t('description')}</p>
            <div className="mt-4 space-y-1 text-sm text-primary-300">
              <p>{t('email')}</p>
              <p>{t('phone')}</p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4 text-primary-100">{t('products')}</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              {['flour_feed','flour_wheat','wheat','barley','bran','flaxseed','sunflower','corn'].map((p) => (
                <li key={p}>
                  <Link href={`/${locale}#products`} className="hover:text-white transition-colors">
                    {p.replace('_', ' ')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-primary-100">{t('company')}</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              <li><Link href={`/${locale}`} className="hover:text-white transition-colors">{t('about')}</Link></li>
              <li><Link href={`/${locale}/suppliers/register`} className="hover:text-white transition-colors">{t('forSuppliers')}</Link></li>
              <li><Link href={`/${locale}#contact`} className="hover:text-white transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-primary-400">
          <p>© {new Date().getFullYear()} KTZ Export. {t('rights')}.</p>
          <p>info@ktzexport.com</p>
        </div>
      </div>
    </footer>
  );
}
