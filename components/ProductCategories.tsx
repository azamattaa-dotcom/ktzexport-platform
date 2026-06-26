import { useTranslations, useLocale } from 'next-intl';
import { PRODUCT_LIST } from '@/lib/products';

export default function ProductCategories() {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <section id="products" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCT_LIST.map((product) => (
            <div
              key={product.id}
              className="group relative bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
            >
              <div className="text-4xl mb-3">{product.emoji}</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-primary-700 text-sm leading-tight">
                {t(`items.${product.id}`)}
              </h3>
              <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{locale === 'zh' ? '查看报价' : locale === 'tr' ? 'Teklif Gör' : locale === 'kk' ? 'Ұсынысты көру' : 'Смотреть предложения'}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <button className="text-primary-700 hover:text-primary-800 font-medium border border-primary-200 hover:border-primary-400 px-6 py-2.5 rounded-lg transition-colors text-sm">
            {t('viewAll')} →
          </button>
        </div>
      </div>
    </section>
  );
}
