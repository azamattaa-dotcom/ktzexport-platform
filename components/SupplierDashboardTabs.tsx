'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Supplier } from '@/lib/db';
import DashboardTabs from './DashboardTabs';
import SupplierMessagesPanel from './SupplierMessagesPanel';
import SupplierProductManager from './SupplierProductManager';
import SupplierPasswordForm from './SupplierPasswordForm';
import SupplierLogisticsRequestsPanel from './SupplierLogisticsRequestsPanel';
import LogisticsForm from './LogisticsForm';

const KNOWN_COUNTRIES = ['Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан', 'Таджикистан', 'Туркменистан', 'Афганистан', 'Китай', 'Турция', 'Другое'];
const KNOWN_VOLUMES = ['lt1000', '1000_5000', '5000_20000', 'gt20000'];

export default function SupplierDashboardTabs({ supplier }: { supplier: Supplier }) {
  const t = useTranslations('supplierDashboard');
  const ts = useTranslations('supplier');
  const [tab, setTab] = useState('profile');

  const isImage = supplier.letterheadBase64?.startsWith('data:image');
  const countryLabel = KNOWN_COUNTRIES.includes(supplier.country) ? ts(`countries.${supplier.country}` as any) : supplier.country;
  const volumeLabel = KNOWN_VOLUMES.includes(supplier.annualVolume) ? ts(`volumes.${supplier.annualVolume}` as any) : supplier.annualVolume;

  const tabs = [
    { id: 'profile', label: t('tabProfile') },
    { id: 'messages', label: t('tabMessages') },
    { id: 'products', label: t('tabProducts') },
    { id: 'logistics', label: t('tabLogistics') },
  ];

  return (
    <div>
      <DashboardTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-6 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                {supplier.companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{supplier.companyName}</h1>
                <p className="text-primary-200 text-sm">{countryLabel}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}</p>
              </div>
              <span className="ml-auto bg-green-400 text-white text-xs font-semibold px-3 py-1 rounded-full">{t('approved')}</span>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">{t('contact')}</p>
                <p className="text-gray-800 font-medium">{supplier.contactName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">{ts('email')}</p>
                <p className="text-gray-800 font-medium">{supplier.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">{ts('phone')}</p>
                <p className="text-gray-800 font-medium">{supplier.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">{ts('annualVolume')}</p>
                <p className="text-gray-800 font-medium">{volumeLabel}</p>
              </div>
            </div>
          </div>

          {supplier.letterheadBase64 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">{t('letterheadTitle')}</h2>
              {isImage ? (
                <img
                  src={supplier.letterheadBase64}
                  alt={t('letterheadTitle')}
                  className="w-full max-h-64 object-contain rounded-xl border border-gray-100"
                />
              ) : (
                <a
                  href={supplier.letterheadBase64}
                  download={supplier.letterheadFileName ?? 'letterhead.pdf'}
                  className="flex items-center gap-3 text-sm text-primary-700 border border-primary-200 rounded-xl px-4 py-3 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-2xl">📄</span>
                  <span>{supplier.letterheadFileName ?? t('downloadDocument')}</span>
                </a>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('passwordTitle')}</h2>
            <SupplierPasswordForm />
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t('messagesTitle')}</h2>
          <SupplierMessagesPanel />
        </div>
      )}

      {tab === 'products' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('productsTitle')}</h2>
          <SupplierProductManager supplier={supplier as any} />
        </div>
      )}

      {tab === 'logistics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('quoteRequestTitle')}</h2>
            <LogisticsForm
              origin="supplier_dashboard"
              prefill={{
                contactName: supplier.contactName,
                contactCompany: supplier.companyName,
                contactEmail: supplier.email,
                contactPhone: supplier.phone,
              }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{t('wagonDislocationTitle')}</h2>
            <p className="text-sm text-gray-400">{t('wagonDislocationPlaceholder')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('logisticsRequestsTitle')}</h2>
            <SupplierLogisticsRequestsPanel />
          </div>
        </div>
      )}
    </div>
  );
}
