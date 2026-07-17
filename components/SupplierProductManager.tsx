'use client';
import { useState } from 'react';
import type { Supplier, ProductDetail, ProductPrice } from '@/lib/db';

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
};

const PRODUCT_EMOJI: Record<string, string> = {
  flour_feed: '🏭', flour_wheat: '🌾', wheat: '🌾', barley: '🌿',
  bran: '🟤', flaxseed: '🫐', sunflower: '🌻', corn: '🌽',
};

interface Props {
  supplier: Omit<Supplier, 'passwordHash' | 'inviteToken'>;
}

function emptyDetail(): ProductDetail {
  return { price: undefined, availableVolume: '', minOrder: '', characteristics: '', certificateBase64: undefined, certificateFileName: undefined };
}

export default function SupplierProductManager({ supplier }: Props) {
  const [details, setDetails] = useState<Record<string, ProductDetail>>(() => {
    const initial: Record<string, ProductDetail> = {};
    for (const pid of supplier.products) {
      initial[pid] = supplier.productDetails?.[pid] ?? emptyDetail();
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(supplier.products[0] ?? null);

  function updateDetail(pid: string, patch: Partial<ProductDetail>) {
    setDetails((prev) => ({ ...prev, [pid]: { ...prev[pid], ...patch } }));
    setSaved(false);
  }

  function updatePrice(pid: string, patch: Partial<ProductPrice>) {
    const current = details[pid]?.price ?? { type: 'fixed', currency: 'USD', unit: 'тонна' };
    updateDetail(pid, { price: { ...current, ...patch } as ProductPrice });
  }

  function handleCertUpload(pid: string, file: File) {
    if (file.size > 3 * 1024 * 1024) { alert('Файл слишком большой (макс. 3 МБ)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      updateDetail(pid, { certificateBase64: e.target?.result as string, certificateFileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/supplier/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productDetails: details }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  return (
    <div className="space-y-3">
      {supplier.products.map((pid) => {
        const d = details[pid] ?? emptyDetail();
        const isOpen = expanded === pid;
        const price = d.price;
        return (
          <div key={pid} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : pid)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PRODUCT_EMOJI[pid]}</span>
                <span className="font-semibold text-gray-900">{PRODUCT_LABELS[pid] ?? pid}</span>
              </div>
              <div className="flex items-center gap-4">
                {price ? (
                  <span className="text-sm font-medium text-primary-700">
                    {price.type === 'fixed'
                      ? `${price.currency === 'USD' ? '$' : '₸'}${price.fixed?.toLocaleString()} / ${price.unit}`
                      : `${price.currency === 'USD' ? '$' : '₸'}${price.min?.toLocaleString()} – ${price.max?.toLocaleString()} / ${price.unit}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Цена не указана</span>
                )}
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded form */}
            {isOpen && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Цена</label>
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={price?.type ?? 'fixed'}
                      onChange={(e) => updatePrice(pid, { type: e.target.value as 'fixed' | 'range' })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="fixed">Фиксированная</option>
                      <option value="range">Диапазон</option>
                    </select>
                    <select
                      value={price?.currency ?? 'USD'}
                      onChange={(e) => updatePrice(pid, { currency: e.target.value as 'USD' | 'KZT' })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KZT">KZT (₸)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Единица (тонна, кг...)"
                      value={price?.unit ?? 'тонна'}
                      onChange={(e) => updatePrice(pid, { unit: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36"
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    {price?.type === 'range' ? (
                      <>
                        <input type="number" placeholder="От" value={price?.min ?? ''} onChange={(e) => updatePrice(pid, { min: +e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                        <input type="number" placeholder="До" value={price?.max ?? ''} onChange={(e) => updatePrice(pid, { max: +e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                      </>
                    ) : (
                      <input type="number" placeholder="Цена" value={price?.fixed ?? ''} onChange={(e) => updatePrice(pid, { fixed: +e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                    )}
                  </div>
                </div>

                {/* Volume */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Доступный объём</label>
                    <input type="text" placeholder="напр. 500 тонн" value={d.availableVolume ?? ''}
                      onChange={(e) => updateDetail(pid, { availableVolume: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Мин. заказ</label>
                    <input type="text" placeholder="напр. 20 тонн" value={d.minOrder ?? ''}
                      onChange={(e) => updateDetail(pid, { minOrder: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                {/* Characteristics */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Характеристики</label>
                  <textarea
                    rows={3}
                    placeholder="Белок, влажность, клейковина, ГОСТ..."
                    value={d.characteristics ?? ''}
                    onChange={(e) => updateDetail(pid, { characteristics: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>

                {/* Certificate */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Сертификат / документ</label>
                  {d.certificateFileName ? (
                    <div className="flex items-center gap-3">
                      <a href={d.certificateBase64} download={d.certificateFileName}
                        className="text-sm text-primary-600 hover:text-primary-800 border border-primary-200 px-3 py-1.5 rounded-lg">
                        📄 {d.certificateFileName}
                      </a>
                      <button onClick={() => updateDetail(pid, { certificateBase64: undefined, certificateFileName: undefined })}
                        className="text-xs text-red-400 hover:text-red-600">Удалить</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 hover:border-primary-300 transition-colors">
                      <span>📎 Прикрепить PDF или изображение (макс. 3 МБ)</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCertUpload(pid, f); }} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Сохраняем...' : saved ? '✓ Сохранено' : 'Сохранить изменения'}
      </button>
    </div>
  );
}
