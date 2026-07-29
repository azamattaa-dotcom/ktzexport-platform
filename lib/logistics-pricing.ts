// Fixed-rate logistics pricing for container train shipments.
// Covers the common route: Northern Kazakhstan -> Altynkol/Dostyk -> major China return stations.
// Anything outside this rule is out of scope for instant pricing ("on request").

export const FLAT_RATE_BORDER_KEYS = ['altynkol', 'dostyk'] as const;
export type FlatRateBorderKey = (typeof FLAT_RATE_BORDER_KEYS)[number];

// Quoted to the buyer as a per-ton rate (800 / 26 ≈ 30.77, rounded up to 31)
// so it lines up cleanly with product pricing, which is also per ton.
export const RATE_USD_PER_TON = 31;

// The actual floor: whatever the per-ton math works out to, KTZ Export must
// receive at least $800 for a 40ft container. A lighter-than-usual load
// (below ~26t) would otherwise undercut this, so every container is billed
// at max(tonsInContainer * RATE_USD_PER_TON, MIN_CHARGE_PER_40FT).
export const MIN_CHARGE_PER_40FT = 800;

// Reference load range used for buyer-facing explanations only.
export const TYPICAL_TONS_PER_40FT = { min: 26, max: 28 };

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

export function isFlatRateRoute(border: string, returnStationId: string): boolean {
  return isFlatRateBorder(border) && isFlatRateReturnStation(returnStationId);
}

export interface ContainerCharge {
  /** What the per-ton math alone would give. */
  computed: number;
  /** What is actually billed — computed, or the $800 floor, whichever is higher. */
  billed: number;
  /** True when the $800 floor kicked in (light load). */
  floorApplied: boolean;
}

/**
 * Per-container logistics charge for a given load, on an eligible route.
 * Returns null if the route isn't covered by the fixed rate (needs a manual quote).
 */
export function getContainerCharge(params: {
  border: string;
  returnStationId: string;
  tonsInContainer: number;
}): ContainerCharge | null {
  const { border, returnStationId, tonsInContainer } = params;
  if (!isFlatRateRoute(border, returnStationId)) return null;
  const computed = tonsInContainer * RATE_USD_PER_TON;
  const billed = Math.max(computed, MIN_CHARGE_PER_40FT);
  return { computed, billed, floorApplied: billed > computed };
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
  logisticsFloorApplied: boolean;
  totalPerContainer: number;
  containers: number;
  grandTotal: number;
}

export function combineWithProductPrice(
  productPricePerTon: number,
  containerCharge: ContainerCharge,
  tonsInContainer: number,
  containers: number
): CombinedEstimate {
  const productPerContainer = productPricePerTon * tonsInContainer;
  const totalPerContainer = productPerContainer + containerCharge.billed;
  return {
    productPerContainer,
    logisticsPerContainer: containerCharge.billed,
    logisticsFloorApplied: containerCharge.floorApplied,
    totalPerContainer,
    containers,
    grandTotal: totalPerContainer * containers,
  };
}
