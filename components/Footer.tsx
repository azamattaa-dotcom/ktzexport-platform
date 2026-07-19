import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { PRODUCT_LIST } from '@/lib/products';

export default function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const tp = useTranslations('products');
  const locale = useLocale();

  return (
    <footer id="contact" className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">KTZ</span>
              </div>
              <span className="font-bold text-lg">KTZ Export</span>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed">{t('description')}</p>
            <div className="mt-4 space-y-1 text-sm text-primary-300">
              <p><a href={`mailto:${t('email')}`} className="hover:text-white transition-colors">{t('email')}</a></p>
              <p><a href={`tel:${t('phone').replace(/\s/g, '')}`} className="hover:text-white transition-colors">{t('phone')}</a></p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4 text-primary-100">{t('products')}</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              {PRODUCT_LIST.map((p) => (
                <li key={p.id}>
                  <Link href={`/${locale}/products/${p.id}`} className="hover:text-white transition-colors">
                    {tp(`items.${p.id}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-primary-100">{t('company')}</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              <li><Link href={`/${locale}`} className="hover:text-white transition-colors">{t('about')}</Link></li>
              <li><Link href={`/${locale}/logistics`} className="hover:text-white transition-colors">{t('logistics')}</Link></li>
              <li><Link href={`/${locale}/suppliers/register`} className="hover:text-white transition-colors">{t('forSuppliers')}</Link></li>
              <li><Link href={`/${locale}/contract`} className="hover:text-white transition-colors">{t('contract')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-primary-100">{t('contact')}</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              <li>
                <a href={`mailto:${t('email')}`} className="hover:text-white transition-colors">
                  {t('email')}
                </a>
              </li>
              <li>
                <a href={`tel:${t('phone').replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                  {t('phone')}
                </a>
              </li>
              <li>
                <Link href={`/${locale}/supplier/login`} className="hover:text-white transition-colors">
                  {tn('login')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-primary-400">
          <p>© {new Date().getFullYear()} KTZ Export. {t('rights')}.</p>
          <p>ТОО «KTZ Export» · БИН 240640023888 · г. Алматы</p>
        </div>
      </div>
    </footer>
  );
}
