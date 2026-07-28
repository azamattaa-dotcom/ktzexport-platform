'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

const STEPS = [
  { num: '01', color: 'bg-primary-100 text-primary-700', icon: '🔍', href: (locale: string) => `/${locale}/products` },
  { num: '02', color: 'bg-wheat-100 text-wheat-600',     icon: '💬', href: null },
  { num: '03', color: 'bg-blue-100 text-blue-700',       icon: '✍️', href: (locale: string) => `/${locale}/contract` },
  { num: '04', color: 'bg-blue-100 text-blue-700',       icon: '🚢', href: (locale: string) => `/${locale}/logistics` },
];

export default function HowItWorks() {
  const t = useTranslations('howItWorks');
  const locale = useLocale();

  function openChat() {
    window.dispatchEvent(new Event('ktz-open-chat'));
  }

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-200 z-0" style={{width:'calc(100% - 4rem)', left:'calc(50% + 2rem)'}}/>
              )}

              {step.href ? (
                <Link
                  href={step.href(locale)}
                  className="relative flex flex-col bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all z-10 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center text-xl mb-4`}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-2">{step.num}</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {t(`step${i + 1}Title`)}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {t(`step${i + 1}Desc`)}
                  </p>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openChat}
                  className="relative flex flex-col text-left w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all z-10 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center text-xl mb-4`}>
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold text-gray-400 mb-2">{step.num}</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {t(`step${i + 1}Title`)}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {t(`step${i + 1}Desc`)}
                  </p>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
