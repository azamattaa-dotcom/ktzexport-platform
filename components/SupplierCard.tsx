'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Supplier } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';
import SupplierChat from './SupplierChat';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', KZT: '₸' };

interface Props {
  supplier: Supplier;
  productId: string;
  locale: string;
}

export default function SupplierCard({ supplier, productId, locale }: Props) {
  const tc = useTranslations('catalog');
  const tp = useTranslations('products.items');
  const tv = useTranslations('supplier.volumes');
  const [expanded, setExpanded] = useState(false);

  const detail = supplier.productDetails?.[productId];
  const price = detail?.price ?? supplier.productPrices?.[productId];
  const isImage = supplier.letterheadBase64?.startsWith('data:image');

  function getVolumeLabel(key: string): string {
    try { return tv(key as any); } catch { return key; }
  }

  function getProductLabel(pid: string): string {
    try { return tp(pid as any); } catch { return pid; }
  }

  function formatPrice() {
    if (!price) return null;
    const sym = CURRENCY_SYMBOL[price.currency] ?? '';
    if (price.type === 'fixed') return `${sym}${price.fixed?.toLocaleString()} / ${price.unit}`;
    return `${sym}${price.min?.toLocaleString()} – ${price.max?.toLocaleString()} / ${price.unit}`;
  }

  const priceStr = formatPrice();
  const volumeLabel = getVolumeLabel(supplier.annualVolume);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
              {supplier.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{supplier.companyName}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {supplier.country}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}
                {supplier.loadingStation ? ` · 🚉 ${supplier.loadingStation}` : ''}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {supplier.products.map((pid) => {
                  const p = PRODUCT_LIST.find((x) => x.id === pid);
                  return (
                    <span key={pid} className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${p?.from ?? 'from-gray-100'} ${p?.to ?? 'to-gray-100'} ${p?.text ?? 'text-gray-700'} border ${p?.border ?? 'border-gray-200'}`}>
                      {p?.emoji} {getProductLabel(pid)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              {priceStr ? (
                <div className="text-primary-700 font-bold text-lg">{priceStr}</div>
              ) : (
                <div className="text-gray-400 text-sm italic">{tc('priceOnRequest')}</div>
              )}
              {detail?.availableVolume && (
                <div className="text-xs text-gray-400 mt-0.5">{tc('available')}: {detail.availableVolume}</div>
              )}
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          {/* Volume */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{tc('volume')}</h3>
            {detail?.availableVolume && <p className="text-sm text-gray-800">{tc('available')}: <span className="font-medium">{detail.availableVolume}</span></p>}
            {detail?.minOrder && <p className="text-sm text-gray-800">{tc('minOrder')}: <span className="font-medium">{detail.minOrder}</span></p>}
            {volumeLabel && <p className="text-sm text-gray-600">{tc('annual')}: <span className="font-medium">{volumeLabel}</span></p>}
          </div>

          {/* Characteristics */}
          {detail?.characteristics && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{tc('characteristics')}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-4">{detail.characteristics}</p>
            </div>
          )}

          {/* Documents */}
          <div className="flex flex-wrap gap-3">
            {detail?.certificateBase64 && (
              <a href={detail.certificateBase64} download={detail.certificateFileName ?? 'certificate'}
                className="flex items-center gap-2 text-sm text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors">
                📄 {detail.certificateFileName ?? tc('downloadLetterhead')}
              </a>
            )}
            {supplier.letterheadBase64 && (
              isImage ? (
                <div className="w-full">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{tc('letterhead')}</h3>
                  <img src={supplier.letterheadBase64} alt={tc('letterhead')} className="max-h-48 rounded-xl border border-gray-100 object-contain" />
                </div>
              ) : (
                <a href={supplier.letterheadBase64} download={supplier.letterheadFileName ?? 'letterhead'}
                  className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  📎 {supplier.letterheadFileName ?? tc('letterhead')}
                </a>
              )
            )}
          </div>

          {/* Chat */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{tc('contactSupplier')}</h3>
            <SupplierChat supplierId={supplier.id} productId={productId} supplierName={supplier.companyName} />
          </div>
        </div>
      )}
    </div>
  );
}
