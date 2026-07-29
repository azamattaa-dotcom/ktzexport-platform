// Fixed-rate logistics pricing for container train shipments.
// Covers the common route: Northern Kazakhstan -> Altynkol/Dostyk -> major China return stations.
// Anything outside this rule is out of scope for instant pricing ("on request").

export const FLAT_RATE_BORDER_KEYS = ['altynkol', 'dostyk'] as const;
export type FlatRateBorderKey = (typeof FLAT_RATE_BORDER_KEYS)[number];

// The headline price: $800 for one 40ft container on an eligible route.
export const FLAT_RATE_USD_PER_40FT = 800;

// Reference load used only to express the $800 as a per-ton rate, so it can
// be added to product prices (which are quoted per ton). Not a real-world
// measurement of any specific shipment — just FLAT_RATE_USD_PER_40FT / 26.
export const REFERENCE_TONS_PER_40FT = 26;

export const RATE_USD_PER_TON = FLAT_RATE_USD_PER_40FT / REFERENCE_TONS_PER_40FT;

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
 * route falls outside the fixed-rate rule (needs a manual quote).
 */
export function getContainerFlatQuote(border: string, returnStationId: string): number | null {
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

export function combineWithProductPrice(
  productPricePerTon: number,
  containers: number
): CombinedEstimate {
  const productPerContainer = productPricePerTon * REFERENCE_TONS_PER_40FT;
  const totalPerContainer = productPerContainer + FLAT_RATE_USD_PER_40FT;
  return {
    productPerContainer,
    logisticsPerContainer: FLAT_RATE_USD_PER_40FT,
    totalPerContainer,
    containers,
    grandTotal: totalPerContainer * containers,
  };
}
