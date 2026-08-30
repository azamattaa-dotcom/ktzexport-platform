'use client';
import { useState, useEffect } from 'react';

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
  origin: 'public' | 'buyer_dashboard' | 'supplier_dashboard';
  supplierName?: string;
  status: 'new' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STATUS_LABEL: Record<LogisticsRequestItem['status'], string> = {
  new: 'Общая заявка',
  pending: 'Ожидает проверки',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};
const STATUS_CLASS: Record<LogisticsRequestItem['status'], string> = {
  new: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

function RequestCard({ item, onDone }: { item: LogisticsRequestItem; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function review(action: 'approve' | 'reject') {
    setBusy(true);
    const res = await fetch('/api/admin/logistics/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, action }),
    });
    setBusy(false);
    if (res.ok) onDone();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-semibold text-gray-900 text-sm">
          {item.stationDeparture} → {item.stationDestination}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <p className="text-sm text-gray-600">{item.transportType} · {item.cargoName} · {item.month}, {item.decade}</p>
      {item.supplierName && (
        <p className="text-sm text-gray-600">Адресовано поставщику: <span className="font-medium">{item.supplierName}</span></p>
      )}
      <p className="text-sm text-gray-500">
        {item.contactName}{item.contactCompany ? ` — ${item.contactCompany}` : ''} · {item.contactEmail}
        {item.contactPhone ? ` · ${item.contactPhone}` : ''}
      </p>
      <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>

      {item.status === 'pending' && (
        <div className="flex gap-2 pt-2">
          <button onClick={() => review('approve')} disabled={busy}
            className="bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Одобрить
          </button>
          <button onClick={() => review('reject')} disabled={busy}
            className="border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
}

export default function LogisticsRequestsTab() {
  const [items, setItems] = useState<LogisticsRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/logistics');
    if (res.ok) {
      const data = await res.json();
      setItems(data.requests ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Загрузка...</div>;

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="text-3xl mb-2">🚆</div>
        <p className="text-sm">Заявок на логистику пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <RequestCard key={item.id} item={item} onDone={load} />
      ))}
    </div>
  );
}
