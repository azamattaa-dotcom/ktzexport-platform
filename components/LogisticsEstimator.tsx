'use client';
import { useState } from 'react';
import {
  FLAT_RATE_BORDER_KEYS,
  FLAT_RATE_RETURN_STATIONS,
  REFERENCE_TONS_PER_40FT,
  getContainerFlatQuote,
  isCombinableWithTonPrice,
  getPerTonBreakdown,
  type FlatRateBorderKey,
} from '@/lib/logistics-pricing';

const BORDER_LABELS: Record<FlatRateBorderKey, string> = {
  altynkol: 'Алтынколь (эксп.) — Хоргос',
  dostyk: 'Достык (эксп.) — Алашанькоу',
};

interface ProductPriceInfo {
  pricePerTon: number;
  currency: string;
  unit: string;
  productId?: string;
  productName?: string;
  supplierId?: string;
  supplierName?: string;
}

interface Props {
  onNeedsQuote?: () => void;
  compact?: boolean;
  /** Pass the supplier's per-ton price to show the combined per-ton breakdown. */
  product?: ProductPriceInfo;
}

export default function LogisticsEstimator({ onNeedsQuote, compact, product }: Props) {
  const [border, setBorder] = useState<FlatRateBorderKey | ''>('');
  const [returnStation, setReturnStation] = useState('');
  const [containers, setContainers] = useState(1);
  const [contact, setContact] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const perContainer = border && returnStation
    ? getContainerFlatQuote(border, returnStation)
    : null;

  const showResult = border !== '' && returnStation !== '';
  const logisticsTotal = perContainer !== null ? perContainer * containers : null;

  const canCombine = !!product && isCombinableWithTonPrice(product.currency, product.unit);
  const breakdown = perContainer !== null && canCombine
    ? getPerTonBreakdown(product!.pricePerTon)
    : null;

  async function submitOrder() {
    if (!contact.trim() || perContainer === null || !border || !returnStation) return;
    setSubmitStatus('sending');
    const returnStationLabel = FLAT_RATE_RETURN_STATIONS.find((s) => s.id === returnStation);
    try {
      const res = await fetch('/api/logistics/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contact.trim(),
          productId: product?.productId,
          productName: product?.productName,
          supplierId: product?.supplierId,
          supplierName: product?.supplierName,
          productPricePerTon: product?.pricePerTon,
          productCurrency: product?.currency,
          productUnit: product?.unit,
          border,
          borderLabel: BORDER_LABELS[border],
          returnStationId: returnStation,
          returnStationLabel: returnStationLabel ? `${returnStationLabel.ru} (${returnStationLabel.en})` : returnStation,
          containers,
          ratePerTon: breakdown?.logisticsPerTon,
          logisticsPerContainer: perContainer,
          totalPerTon: breakdown?.totalPerTon,
        }),
      });
      setSubmitStatus(res.ok ? 'sent' : 'error');
    } catch {
      setSubmitStatus('error');
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Погранпереход</label>
          <select
            value={border}
            onChange={(e) => setBorder(e.target.value as FlatRateBorderKey | '')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Выберите</option>
            {FLAT_RATE_BORDER_KEYS.map((key) => (
              <option key={key} value={key}>{BORDER_LABELS[key]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Станция возврата контейнера</label>
          <select
            value={returnStation}
            onChange={(e) => setReturnStation(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Выберите</option>
            {FLAT_RATE_RETURN_STATIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.ru} ({s.en})</option>
            ))}
            <option value="__other__">Другая станция</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Контейнеров (40 фут)</label>
          <input
            type="number"
            min={1}
            value={containers}
            onChange={(e) => setContainers(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {showResult && (
        logisticsTotal !== null && perContainer !== null ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            {breakdown ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Цена за тонну</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>(a) Цена за тонну (товар): <span className="font-semibold">${breakdown.productPerTon.toLocaleString()}</span></p>
                  <p>(b) Постоянные расходы (логистика): <span className="font-semibold">${breakdown.logisticsPerTon.toFixed(2)}</span></p>
                  <p className="text-base font-bold text-green-800 pt-1 border-t border-green-200">
                    (c) Итого за тонну: ${breakdown.totalPerTon.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Логистика — фиксированная стоимость перевозки одного 40-фут. контейнера (${perContainer.toLocaleString()}), выраженная здесь как расход на тонну от базы {REFERENCE_TONS_PER_40FT} т. Она не меняется от того, сколько тонн реально войдёт в контейнер (26, 27 или 28) — итоговая сумма зависит от фактического веса и считается по цене за тонну.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  Логистика: <span className="font-semibold">${perContainer.toLocaleString()} за один 40-фут. контейнер</span>
                </p>
                {product && (
                  <p className="text-xs text-gray-500">
                    Цену товара в {product.currency === 'KZT' ? 'тенге' : product.unit} к этой логистике автоматически не складываем — избегаем угадывания курса/единиц.
                  </p>
                )}
              </>
            )}

            <p className="text-sm text-gray-700 pt-2 border-t border-green-200">
              Логистика на {containers} {containers === 1 ? 'контейнер' : 'контейнера(ов)'}: <span className="font-semibold">${logisticsTotal.toLocaleString()}</span>
            </p>

            <div className="pt-3 mt-1 border-t border-green-200">
              {submitStatus === 'sent' ? (
                <p className="text-sm text-green-700 font-medium">✓ Заявка отправлена — мы свяжемся с вами.</p>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Оформить заявку — оставьте контакт</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Имя, телефон или email"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={submitOrder}
                      disabled={!contact.trim() || submitStatus === 'sending'}
                      className="bg-primary-700 hover:bg-primary-800 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {submitStatus === 'sending' ? 'Отправляем...' : 'Оформить заявку'}
                    </button>
                  </div>
                  {submitStatus === 'error' && (
                    <p className="text-xs text-red-600">Не получилось отправить, попробуйте ещё раз.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-700">
              По этому маршруту стоимость — <span className="font-semibold">по запросу</span>. Напишите нам, ответим сразу.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onNeedsQuote) onNeedsQuote();
                else window.dispatchEvent(new Event('ktz-open-chat'));
              }}
              className="text-sm font-medium text-primary-700 hover:text-primary-900 underline"
            >
              Написать нам →
            </button>
          </div>
        )
      )}
    </div>
  );
}
