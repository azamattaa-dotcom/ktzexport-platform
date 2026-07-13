import { useTranslations } from 'next-intl';

function KTZContainerSVG() {
  return (
    <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Container body */}
      <rect x="2" y="8" width="96" height="40" rx="3" fill="#1d4ed8" />
      {/* Vertical ribs */}
      {[20, 38, 56, 74].map((x) => (
        <line key={x} x1={x} y1="8" x2={x} y2="48" stroke="#3b82f6" strokeWidth="1.5" />
      ))}
      {/* Top rail */}
      <rect x="2" y="6" width="96" height="5" rx="2" fill="#1e40af" />
      {/* Bottom rail */}
      <rect x="2" y="46" width="96" height="4" rx="1" fill="#1e40af" />
      {/* Wheels */}
      <circle cx="20" cy="54" r="5" fill="#374151" />
      <circle cx="80" cy="54" r="5" fill="#374151" />
      <circle cx="20" cy="54" r="2" fill="#6b7280" />
      <circle cx="80" cy="54" r="2" fill="#6b7280" />
      {/* KTZ text */}
      <text x="50" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="1">KTZ</text>
    </svg>
  );
}

const REASONS = [
  { key: 'reason1', bg: 'bg-blue-50',     border: 'border-blue-100',    useIcon: 'ktz' },
  { key: 'reason2', icon: '✅',            bg: 'bg-green-50',            border: 'border-green-100' },
  { key: 'reason3', icon: '📜',            bg: 'bg-primary-50',          border: 'border-primary-100' },
  { key: 'reason4', icon: '🌍',            bg: 'bg-wheat-50',            border: 'border-wheat-100' },
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
              <div className="mb-4">
                {r.useIcon === 'ktz' ? <KTZContainerSVG /> : <span className="text-3xl">{r.icon}</span>}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">{t(`${r.key}Title`)}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">{t(`${r.key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
