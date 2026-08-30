'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface LogisticsRequestItem {
  id: string;
  transportType: string;
  stationDeparture: string;
  stationDestination: string;
  cargoName: string;
  month: string;
  decade: string;
  contactName: string;
  contactCompany?: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
}

export default function SupplierLogisticsRequestsPanel() {
  const t = useTranslations('logisticsRequests');
  const [requests, setRequests] = useState<LogisticsRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supplier/logistics-requests')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-400 text-sm">{t('loading')}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <div className="text-3xl mb-2">🚆</div>
        <p className="text-sm">{t('emptySupplier')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-semibold text-gray-900 text-sm">
              {r.stationDeparture} → {r.stationDestination}
            </span>
            <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{r.transportType} · {r.cargoName}</p>
          <p className="text-xs text-gray-400 mb-3">{r.month}, {r.decade}</p>
          <div className="border-t border-gray-100 pt-3 text-sm text-gray-700">
            <p className="font-medium">{r.contactName}{r.contactCompany ? ` — ${r.contactCompany}` : ''}</p>
            <p className="text-gray-500">{r.contactEmail}{r.contactPhone ? ` · ${r.contactPhone}` : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
