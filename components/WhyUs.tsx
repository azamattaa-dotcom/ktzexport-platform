import { useTranslations } from 'next-intl';

const REASONS = [
  { key: 'reason1', icon: '🚂', bg: 'bg-primary-50', border: 'border-primary-100' },
  { key: 'reason2', icon: '✅', bg: 'bg-green-50',   border: 'border-green-100' },
  { key: 'reason3', icon: '📜', bg: 'bg-blue-50',    border: 'border-blue-100' },
  { key: 'reason4', icon: '🌍', bg: 'bg-wheat-50',   border: 'border-wheat-100' },
];

export default function WhyUs() {
  const t = useTranslations('whyUs');

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{t('title')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REASONS.map((r) => (
            <div key={r.key} className={`${r.bg} border ${r.border} rounded-2xl p-6`}>
              <div className="text-3xl mb-4">{r.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">{t(`${r.key}Title`)}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">{t(`${r.key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
