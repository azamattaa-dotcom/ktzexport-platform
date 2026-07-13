import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { PRODUCT_LIST } from '@/lib/products';

const VIEW_LABEL: Record<string, string> = {
  ru: 'Смотреть поставщиков',
  kk: 'Жеткізушілерді көру',
  en: 'View Suppliers',
  zh: '查看供应商',
  tr: 'Tedarikçileri Gör',
};

export default function ProductCategories() {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <section id="products" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCT_LIST.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/products/${product.id}`}
              className={`group relative bg-gradient-to-br ${product.from} ${product.to} border ${product.border} rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] block`}
            >
              {/* Icon area */}
              <div className="mb-3 h-16 flex items-center">
                <span className="text-5xl filter drop-shadow-sm">{product.emoji}</span>
              </div>

              {/* Name */}
              <h3 className={`font-bold text-sm leading-tight mb-1 ${product.text}`}>
                {t(`items.${product.id}`)}
              </h3>

              {/* CTA */}
              <div className="flex items-center gap-1 text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <span>{VIEW_LABEL[locale] ?? VIEW_LABEL.ru}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/products`}
            className="text-primary-700 hover:text-primary-800 font-medium border border-primary-200 hover:border-primary-400 px-6 py-2.5 rounded-lg transition-colors text-sm inline-block"
          >
            {t('viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
