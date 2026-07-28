'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface BuyerProfile {
  id: string;
  companyName: string;
  country: string;
  registrationNumber: string;
  legalAddress: string;
  postalAddress: string;
  signatoryName: string;
  signatoryType: string;
  signatoryCustomType?: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  bankName: string;
  swift: string;
  bankAccount: string;
  bankCurrency: string;
  unloadingRegion: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  hasCharter: boolean;
  hasRegistration: boolean;
  hasPassport: boolean;
  createdAt: string;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-400 text-xs">{label}</span>
      <p className="text-gray-900 font-medium mt-0.5 text-sm">{value}</p>
    </div>
  );
}

export default function BuyerDashboardPage() {
  const t = useTranslations('buyerDashboard');
  const tr = useTranslations('buyerRegister');
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buyer/me')
      .then((r) => { if (r.status === 401) router.push(`/${locale}/buyer/login`); return r.ok ? r.json() : null; })
      .then((d) => { if (d) setBuyer(d); })
      .finally(() => setLoading(false));
  }, [locale, router]);

  async function handleLogout() {
    await fetch('/api/buyer/logout', { method: 'POST' });
    router.push(`/${locale}/buyer/login`);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">{t('loading')}</div>
    </div>
  );

  if (!buyer) return null;

  const STATUS_CONFIG = {
    pending:  { label: t('statusPending'),  color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    approved: { label: t('statusApproved'), color: 'bg-green-100 text-green-800',   icon: '✅' },
    rejected: { label: t('statusRejected'), color: 'bg-red-100 text-red-800',       icon: '❌' },
  };

  const st = STATUS_CONFIG[buyer.status];
  const signatoryLabel = buyer.signatoryType === 'other'
    ? buyer.signatoryCustomType
    : tr(`signatoryTypes.${buyer.signatoryType}`);
  const countryLabel = tr(`countries.${buyer.country}`);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KTZ</span>
          </div>
          <span className="font-bold text-gray-900">KTZ Export</span>
        </Link>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          {t('logout')}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{buyer.companyName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{countryLabel} · {buyer.registrationNumber}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${st.color}`}>
              {st.icon} {st.label}
            </span>
          </div>

          {buyer.status === 'pending' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              {t('pendingNotice')}
            </div>
          )}
          {buyer.status === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <span className="font-medium">{t('rejectedReasonLabel')}</span> {buyer.rejectionReason || t('rejectedReasonNone')}
              <br />{t('rejectedContact')} <a href="mailto:info@ktzexport.com" className="underline">info@ktzexport.com</a>
            </div>
          )}
          {buyer.status === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              {t('approvedNotice')}
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('sectionCompany')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label={t('legalAddress')} value={buyer.legalAddress} />
            <InfoRow label={t('postalAddress')} value={buyer.postalAddress} />
            <InfoRow label={t('contactName')} value={buyer.contactName} />
            <InfoRow label={t('email')} value={buyer.email} />
            <InfoRow label={t('phone')} value={buyer.phone} />
            {buyer.website && <InfoRow label={t('website')} value={buyer.website} />}
          </div>
        </div>

        {/* Signatory */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('sectionSignatory')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label={t('signatoryName')} value={buyer.signatoryName} />
            <InfoRow label={t('signatoryTypeLabel')} value={signatoryLabel} />
          </div>
        </div>

        {/* Banking */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('sectionBanking')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label={t('bankName')} value={buyer.bankName} />
            <InfoRow label={t('swift')} value={buyer.swift} />
            <InfoRow label={t('bankAccount')} value={buyer.bankAccount} />
            <InfoRow label={t('bankCurrency')} value={buyer.bankCurrency} />
          </div>
        </div>

        {/* Unloading region */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('sectionLogistics')}</h2>
          <InfoRow label={t('unloadingRegion')} value={buyer.unloadingRegion} />
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('sectionDocuments')}</h2>
          <div className="space-y-2">
            {[
              [t('doc1'), buyer.hasCharter],
              [t('doc2'), buyer.hasRegistration],
              [t('doc3'), buyer.hasPassport],
            ].map(([label, has]) => (
              <div key={label as string} className="flex items-center gap-3 text-sm">
                <span className={has ? 'text-green-500' : 'text-gray-300'}>{has ? '✓' : '○'}</span>
                <span className={has ? 'text-gray-800' : 'text-gray-400'}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>

        {buyer.status === 'approved' && (
          <Link href={`/${locale}/products`}
            className="block w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-xl text-sm text-center transition-colors">
            {t('goToCatalog')}
          </Link>
        )}
      </main>
    </div>
  );
}
