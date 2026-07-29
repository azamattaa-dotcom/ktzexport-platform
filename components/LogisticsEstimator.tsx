'use client';
import { useState } from 'react';
import {
  FLAT_RATE_BORDER_KEYS,
  FLAT_RATE_RETURN_STATIONS,
  getContainerCharge,
  isCombinableWithTonPrice,
  combineWithProductPrice,
  RATE_USD_PER_TON,
  MIN_CHARGE_PER_40FT,
  TYPICAL_TONS_PER_40FT,
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
}

interface Props {
  onNeedsQuote?: () => void;
  compact?: boolean;
  /** Pass the supplier's per-ton price to unlock a combined product+logistics total. */
  product?: ProductPriceInfo;
}

export default function LogisticsEstimator({ onNeedsQuote, compact, product }: Props) {
  const [border, setBorder] = useState<FlatRateBorderKey | ''>('');
  const [returnStation, setReturnStation] = useState('');
  const [containers, setContainers] = useState(1);
  const [tonsPerContainer, setTonsPerContainer] = useState(TYPICAL_TONS_PER_40FT.min);

  const charge = border && returnStation
    ? getContainerCharge({ border, returnStationId: returnStation, tonsInContainer: tonsPerContainer })
    : null;

  const showResult = border !== '' && returnStation !== '';
  const logisticsTotal = charge !== null ? charge.billed * containers : null;

  const canCombine = !!product && isCombinableWithTonPrice(product.currency, product.unit);
  const combined = charge !== null && canCombine
    ? combineWithProductPrice(product!.pricePerTon, charge, tonsPerContainer, containers)
    : null;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Тонн в контейнере</label>
          <input
            type="number"
            min={1}
            max={40}
            value={tonsPerContainer}
            onChange={(e) => setTonsPerContainer(Math.max(1, parseFloat(e.target.value) || TYPICAL_TONS_PER_40FT.min))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">Обычно {TYPICAL_TONS_PER_40FT.min}–{TYPICAL_TONS_PER_40FT.max} т</p>
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
        logisticsTotal !== null && charge !== null ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-700">
              Логистика: <span className="font-semibold">${RATE_USD_PER_TON}/т × {tonsPerContainer} т = ${charge.computed.toLocaleString()}</span>
              {charge.floorApplied && (
                <span className="text-amber-700"> → минимум ${MIN_CHARGE_PER_40FT}/контейнер</span>
              )}
            </p>
            <p className="text-sm text-gray-700">
              Итого логистика ({containers} {containers === 1 ? 'контейнер' : 'конт.'}): <span className="font-semibold">${logisticsTotal.toLocaleString()}</span>
            </p>
            <p className="text-xs text-gray-500">
              ${RATE_USD_PER_TON} за тонну, но не менее ${MIN_CHARGE_PER_40FT} за 40-фут. контейнер — на этом маршруте гарантированный минимум.
            </p>

            {combined ? (
              <div className="pt-2 mt-2 border-t border-green-200 space-y-1">
                <p className="text-sm text-gray-700">
                  Товар: <span className="font-semibold">${combined.productPerContainer.toLocaleString()}</span> / контейнер ({tonsPerContainer} т)
                </p>
                <p className="text-base font-bold text-green-800">
                  Итого за {containers} {containers === 1 ? 'контейнер' : 'контейнера(ов)'}: ${combined.grandTotal.toLocaleString()}
                </p>
              </div>
            ) : product ? (
              <p className="text-xs text-gray-500 pt-2 mt-2 border-t border-green-200">
                Цену товара в {product.currency === 'KZT' ? 'тенге' : product.unit} к этой логистике автоматически не складываем — избегаем угадывания курса/единиц. Итоговую сумму лучше уточнить у поставщика.
              </p>
            ) : null}
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
