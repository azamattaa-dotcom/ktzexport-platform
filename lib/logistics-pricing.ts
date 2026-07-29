// Fixed-rate logistics pricing for container train shipments.
// Covers the common route: Northern Kazakhstan -> Altynkol/Dostyk -> major China return stations.
// Anything outside this rule is out of scope for instant pricing ("on request").

export const FLAT_RATE_BORDER_KEYS = ['altynkol', 'dostyk'] as const;
export type FlatRateBorderKey = (typeof FLAT_RATE_BORDER_KEYS)[number];

export const FLAT_RATE_USD_PER_40FT = 800;

// Conservative (minimum) load per 40ft container. Real capacity can reach
// 28t depending on cargo; 26t is used deliberately as the safe lower bound
// so the combined estimate never overstates what fits in the container.
export const MIN_TONS_PER_40FT = 26;

export interface ReturnStation {
  id: string;
  en: string;
  ru: string;
}

export const FLAT_RATE_RETURN_STATIONS: ReturnStation[] = [
  { id: 'shanghai',     en: 'Shanghai',     ru: 'Шанхай' },
  { id: 'taicang',      en: 'Taicang',      ru: 'Тайцан' },
  { id: 'tianjin',      en: 'Tianjin',      ru: 'Тяньцзинь' },
  { id: 'qingdao',      en: 'Qingdao',      ru: 'Циндао' },
  { id: 'ningbo',       en: 'Ningbo',       ru: 'Нинбо' },
  { id: 'shenzhen',     en: 'Shenzhen',     ru: 'Шэньчжэнь' },
  { id: 'guangzhou',    en: 'Guangzhou',    ru: 'Гуанчжоу' },
  { id: 'yiwu',         en: 'Yiwu',         ru: 'Иу' },
  { id: 'lianyungang',  en: 'Lianyungang',  ru: 'Ляньюньган' },
];

export function isFlatRateBorder(border: string): border is FlatRateBorderKey {
  return (FLAT_RATE_BORDER_KEYS as readonly string[]).includes(border);
}

export function isFlatRateReturnStation(stationId: string): boolean {
  return FLAT_RATE_RETURN_STATIONS.some((s) => s.id === stationId);
}

/**
 * Returns the flat USD price for one 40ft container, or null if this
 * route/size falls outside the fixed-rate rule (needs a manual quote).
 */
export function getContainerFlatQuote(params: {
  border: string;
  returnStationId: string;
  containerSize: '40ft' | '20ft';
}): number | null {
  const { border, returnStationId, containerSize } = params;
  if (containerSize !== '40ft') return null;
  if (!isFlatRateBorder(border)) return null;
  if (!isFlatRateReturnStation(returnStationId)) return null;
  return FLAT_RATE_USD_PER_40FT;
}

/**
 * A combined product+logistics total is only meaningful when both legs are
 * priced in USD per metric ton — otherwise we'd be guessing an FX rate or a
 * unit conversion, which is worse than showing nothing.
 */
export function isCombinableWithTonPrice(currency: string, unit: string): boolean {
  return currency === 'USD' && /тонн|ton/i.test(unit);
}

export interface CombinedEstimate {
  productPerContainer: number;
  logisticsPerContainer: number;
  totalPerContainer: number;
  containers: number;
  grandTotal: number;
}

/**
 * Combines per-ton product price with the flat per-container logistics rate,
 * using the conservative MIN_TONS_PER_40FT load factor. Caller must have
 * already confirmed isCombinableWithTonPrice() for the product's price.
 */
export function combineWithProductPrice(
  productPricePerTon: number,
  logisticsPerContainer: number,
  containers: number
): CombinedEstimate {
  const productPerContainer = productPricePerTon * MIN_TONS_PER_40FT;
  const totalPerContainer = productPerContainer + logisticsPerContainer;
  return {
    productPerContainer,
    logisticsPerContainer,
    totalPerContainer,
    containers,
    grandTotal: totalPerContainer * containers,
  };
}
