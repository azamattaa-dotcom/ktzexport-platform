// Fixed-rate logistics pricing for container train shipments.
// Covers the common route: Northern Kazakhstan -> Altynkol/Dostyk -> major China return stations.
// Anything outside this rule is out of scope for instant pricing ("on request").

export const FLAT_RATE_BORDER_KEYS = ['altynkol', 'dostyk'] as const;
export type FlatRateBorderKey = (typeof FLAT_RATE_BORDER_KEYS)[number];

export const FLAT_RATE_USD_PER_40FT = 800;

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
