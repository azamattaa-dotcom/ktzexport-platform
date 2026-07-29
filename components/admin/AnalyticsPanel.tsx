'use client';
import { useMemo, useState } from 'react';
import type { Supplier } from '@/lib/db';
import type { ChatLead } from '@/lib/chat-leads';

type Granularity = 'week' | 'month' | 'quarter';

interface BuyerLike {
  status: string;
  createdAt: string;
}

interface Bucket {
  key: string;
  label: string;
  newSuppliers: number;
  approvedSuppliers: number;
  rejectedSuppliers: number;
  newBuyers: number;
  approvedBuyers: number;
  rejectedBuyers: number;
  leadsBuyer: number;
  leadsSupplier: number;
  leadsLogisticsOrder: number;
  leadsOther: number;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function periodKey(date: Date, granularity: Granularity): string {
  if (granularity === 'week') {
    return startOfWeek(date).toISOString().slice(0, 10);
  }
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

function periodLabel(key: string, granularity: Granularity): string {
  if (granularity === 'week') {
    const start = new Date(key);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    return `${fmt(start)} – ${fmt(end)}`;
  }
  if (granularity === 'month') {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }
  const [y, q] = key.split('-');
  return `${q} ${y}`;
}

function emptyBucket(key: string, granularity: Granularity): Bucket {
  return {
    key, label: periodLabel(key, granularity),
    newSuppliers: 0, approvedSuppliers: 0, rejectedSuppliers: 0,
    newBuyers: 0, approvedBuyers: 0, rejectedBuyers: 0,
    leadsBuyer: 0, leadsSupplier: 0, leadsLogisticsOrder: 0, leadsOther: 0,
  };
}

function buildBuckets(
  suppliers: Supplier[],
  buyers: BuyerLike[],
  leads: ChatLead[],
  granularity: Granularity
): Bucket[] {
  const map = new Map<string, Bucket>();
  function ensure(key: string): Bucket {
    let b = map.get(key);
    if (!b) { b = emptyBucket(key, granularity); map.set(key, b); }
    return b;
  }

  suppliers.forEach((s) => {
    const b = ensure(periodKey(new Date(s.createdAt), granularity));
    b.newSuppliers++;
    if (s.status === 'approved') b.approvedSuppliers++;
    if (s.status === 'rejected') b.rejectedSuppliers++;
  });

  buyers.forEach((buyer) => {
    const b = ensure(periodKey(new Date(buyer.createdAt), granularity));
    b.newBuyers++;
    if (buyer.status === 'approved') b.approvedBuyers++;
    if (buyer.status === 'rejected') b.rejectedBuyers++;
  });

  leads.forEach((l) => {
    const b = ensure(periodKey(new Date(l.createdAt), granularity));
    if (l.intent === 'buyer') b.leadsBuyer++;
    else if (l.intent === 'supplier') b.leadsSupplier++;
    else if (l.intent === 'logistics_order') b.leadsLogisticsOrder++;
    else b.leadsOther++;
  });

  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  week: 'Еженедельно',
  month: 'Ежемесячно',
  quarter: 'Ежеквартально',
};

export default function AnalyticsPanel({
  suppliers,
  buyers,
  leads,
}: {
  suppliers: Supplier[];
  buyers: BuyerLike[];
  leads: ChatLead[];
}) {
  const [granularity, setGranularity] = useState<Granularity>('week');

  const buckets = useMemo(
    () => buildBuckets(suppliers, buyers, leads, granularity),
    [suppliers, buyers, leads, granularity]
  );

  const totals = useMemo(() => {
    return buckets.reduce(
      (acc, b) => ({
        newSuppliers: acc.newSuppliers + b.newSuppliers,
        newBuyers: acc.newBuyers + b.newBuyers,
        leads: acc.leads + b.leadsBuyer + b.leadsSupplier + b.leadsLogisticsOrder + b.leadsOther,
        logisticsOrders: acc.logisticsOrders + b.leadsLogisticsOrder,
      }),
      { newSuppliers: 0, newBuyers: 0, leads: 0, logisticsOrders: 0 }
    );
  }, [buckets]);

  return (
    <div className="space-y-6">
      {/* Granularity switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['week', 'month', 'quarter'] as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              granularity === g ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{totals.newSuppliers}</p>
          <p className="text-xs text-gray-500 mt-1">Новых поставщиков</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{totals.newBuyers}</p>
          <p className="text-xs text-gray-500 mt-1">Новых покупателей</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{totals.leads}</p>
          <p className="text-xs text-gray-500 mt-1">Лидов из чата/заявок</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-2xl font-bold text-gray-900">{totals.logisticsOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Заявок товар+логистика</p>
        </div>
      </div>

      {/* Period table */}
      {buckets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl">
          Данных пока нет
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Период</th>
                  <th className="text-center px-3 py-3 font-medium">Поставщики (нов./одобр./откл.)</th>
                  <th className="text-center px-3 py-3 font-medium">Покупатели (нов./одобр./откл.)</th>
                  <th className="text-center px-3 py-3 font-medium">Лиды: покупатель</th>
                  <th className="text-center px-3 py-3 font-medium">Лиды: поставщик</th>
                  <th className="text-center px-3 py-3 font-medium">Заявки товар+логистика</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.key} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{b.label}</td>
                    <td className="px-3 py-3 text-center text-gray-700">
                      {b.newSuppliers} <span className="text-gray-400">/ {b.approvedSuppliers} / {b.rejectedSuppliers}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">
                      {b.newBuyers} <span className="text-gray-400">/ {b.approvedBuyers} / {b.rejectedBuyers}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700">{b.leadsBuyer}</td>
                    <td className="px-3 py-3 text-center text-gray-700">{b.leadsSupplier}</td>
                    <td className="px-3 py-3 text-center text-gray-700">{b.leadsLogisticsOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
