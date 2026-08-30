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
  supplierName?: string;
  status: 'new' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function BuyerLogisticsRequestsPanel({ refreshKey }: { refreshKey?: number }) {
  const t = useTranslations('logisticsRequests');
  const [requests, setRequests] = useState<LogisticsRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/buyer/logistics-requests')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => setRequests((d.requests ?? []).filter((r: LogisticsRequestItem) => r.supplierName)))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const statusLabel: Record<LogisticsRequestItem['status'], string> = {
    new: t('statusPending'),
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  };
  const statusClass: Record<LogisticsRequestItem['status'], string> = {
    new: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-400 text-sm">{t('loading')}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <div className="text-3xl mb-2">🚆</div>
        <p className="text-sm">{t('emptyBuyer')}</p>
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
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass[r.status]}`}>
              {statusLabel[r.status]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{r.transportType} · {r.cargoName}</p>
          <p className="text-xs text-gray-400">
            {t('supplierLabel')}: {r.supplierName} · {formatDate(r.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
