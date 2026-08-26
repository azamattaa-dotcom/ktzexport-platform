'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Supplier, ProductDetail, ProductPrice } from '@/lib/db';
import { containsContactInfo, CONTACT_BLOCK_MESSAGE } from '@/lib/contactValidator';

const PRODUCT_EMOJI: Record<string, string> = {
  flour_feed: '🏭', flour_wheat: '🌾', wheat: '🌾', barley: '🌿',
  bran: '🟤', flaxseed: '🫐', sunflower: '🌻', corn: '🌽', groats: '🥣',
};

interface Props {
  supplier: Omit<Supplier, 'passwordHash' | 'inviteToken'>;
  // Lets the admin edit screen reuse this same widget against the admin API
  // instead of the supplier's own session-authenticated endpoint.
  apiUrl?: string;
  method?: 'PATCH' | 'PUT';
}

function emptyDetail(): ProductDetail {
  return { price: undefined, availableVolume: '', minOrder: '', characteristics: '', certificateBase64: undefined, certificateFileName: undefined };
}

export default function SupplierProductManager({ supplier, apiUrl = '/api/supplier/me', method = 'PATCH' }: Props) {
  const t = useTranslations('supplierProductManager');
  const tp = useTranslations('products');
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
  const [contactErrors, setContactErrors] = useState<Record<string, boolean>>(() => {
    const errs: Record<string, boolean> = {};
    for (const pid of supplier.products) {
      const chars = supplier.productDetails?.[pid]?.characteristics ?? '';
      if (chars && containsContactInfo(chars)) errs[pid] = true;
    }
    return errs;
  });

  function updateDetail(pid: string, patch: Partial<ProductDetail>) {
    setDetails((prev) => ({ ...prev, [pid]: { ...prev[pid], ...patch } }));
    setSaved(false);
  }

  function updatePrice(pid: string, patch: Partial<ProductPrice>) {
    const current = details[pid]?.price ?? { type: 'fixed', currency: 'USD', unit: t('defaultUnit') };
    updateDetail(pid, { price: { ...current, ...patch } as ProductPrice });
  }

  function handleCertUpload(pid: string, file: File) {
    if (file.size > 3 * 1024 * 1024) { alert(t('fileTooLarge')); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      updateDetail(pid, { certificateBase64: e.target?.result as string, certificateFileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(apiUrl, {
      method,
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
                <span className="font-semibold text-gray-900">{tp(`items.${pid}` as any) ?? pid}</span>
              </div>
              <div className="flex items-center gap-4">
                {price ? (
                  <span className="text-sm font-medium text-primary-700">
                    {price.type === 'fixed'
                      ? `${price.currency === 'USD' ? '$' : '₸'}${price.fixed?.toLocaleString()} / ${price.unit}`
                      : `${price.currency === 'USD' ? '$' : '₸'}${price.min?.toLocaleString()} – ${price.max?.toLocaleString()} / ${price.unit}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">{t('priceNotSet')}</span>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('priceLabel')}</label>
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={price?.type ?? 'fixed'}
                      onChange={(e) => updatePrice(pid, { type: e.target.value as 'fixed' | 'range' })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="fixed">{t('priceFixed')}</option>
                      <option value="range">{t('priceRange')}</option>
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
                      placeholder={t('unitPlaceholder')}
                      value={price?.unit ?? t('defaultUnit')}
                      onChange={(e) => updatePrice(pid, { unit: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36"
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    {price?.type === 'range' ? (
                      <>
                        <input type="number" placeholder={t('fromPlaceholder')} value={price?.min ?? ''} onChange={(e) => updatePrice(pid, { min: +e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                        <input type="number" placeholder={t('toPlaceholder')} value={price?.max ?? ''} onChange={(e) => updatePrice(pid, { max: +e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                      </>
                    ) : (
                      <input type="number" placeholder={t('pricePlaceholder')} value={price?.fixed ?? ''} onChange={(e) => updatePrice(pid, { fixed: +e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
                    )}
                  </div>
                </div>

                {/* Volume */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('availableVolumeLabel')}</label>
                    <input type="text" placeholder={t('availableVolumePlaceholder')} value={d.availableVolume ?? ''}
                      onChange={(e) => updateDetail(pid, { availableVolume: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('minOrderLabel')}</label>
                    <input type="text" placeholder={t('minOrderPlaceholder')} value={d.minOrder ?? ''}
                      onChange={(e) => updateDetail(pid, { minOrder: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                {/* Characteristics */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('characteristicsLabel')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('characteristicsPlaceholder')}
                    value={d.characteristics ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateDetail(pid, { characteristics: val });
                      setContactErrors((prev) => ({ ...prev, [pid]: containsContactInfo(val) }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${contactErrors[pid] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {contactErrors[pid] && (
                    <p className="mt-1 text-xs text-red-600">{CONTACT_BLOCK_MESSAGE}</p>
                  )}
                </div>

                {/* Certificate */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('certificateLabel')}</label>
                  {d.certificateFileName ? (
                    <div className="flex items-center gap-3">
                      <a href={d.certificateBase64} download={d.certificateFileName}
                        className="text-sm text-primary-600 hover:text-primary-800 border border-primary-200 px-3 py-1.5 rounded-lg">
                        📄 {d.certificateFileName}
                      </a>
                      <button onClick={() => updateDetail(pid, { certificateBase64: undefined, certificateFileName: undefined })}
                        className="text-xs text-red-400 hover:text-red-600">{t('deleteLabel')}</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 hover:border-primary-300 transition-colors">
                      <span>{t('attachLabel')}</span>
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
        disabled={saving || Object.values(contactErrors).some(Boolean)}
        className="w-full bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? t('saving') : saved ? t('saved') : t('saveChanges')}
      </button>
    </div>
  );
}
