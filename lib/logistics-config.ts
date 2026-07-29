import { kv } from '@vercel/kv';

export interface LogisticsBorder {
  id: string;
  label: string;
}

export interface LogisticsStation {
  id: string;
  ru: string;
  en: string;
  pricePerContainer: number;
}

export interface LogisticsConfig {
  borders: LogisticsBorder[];
  stations: LogisticsStation[];
  referenceTonsPerContainer: number;
}

const KV_KEY = 'logistics_config';

// Seed data — matches what was previously hardcoded, so nothing changes
// on the live site until an admin edits it here.
const DEFAULT_CONFIG: LogisticsConfig = {
  referenceTonsPerContainer: 26,
  borders: [
    { id: 'altynkol', label: 'Алтынколь (эксп.) — Хоргос' },
    { id: 'dostyk', label: 'Достык (эксп.) — Алашанькоу' },
  ],
  stations: [
    { id: 'shanghai',    ru: 'Шанхай',      en: 'Shanghai',    pricePerContainer: 800 },
    { id: 'taicang',     ru: 'Тайцан',      en: 'Taicang',     pricePerContainer: 800 },
    { id: 'tianjin',     ru: 'Тяньцзинь',   en: 'Tianjin',     pricePerContainer: 800 },
    { id: 'qingdao',     ru: 'Циндао',      en: 'Qingdao',     pricePerContainer: 800 },
    { id: 'ningbo',      ru: 'Нинбо',       en: 'Ningbo',      pricePerContainer: 800 },
    { id: 'shenzhen',    ru: 'Шэньчжэнь',   en: 'Shenzhen',    pricePerContainer: 800 },
    { id: 'guangzhou',   ru: 'Гуанчжоу',    en: 'Guangzhou',   pricePerContainer: 800 },
    { id: 'yiwu',        ru: 'Иу',          en: 'Yiwu',        pricePerContainer: 800 },
    { id: 'lianyungang', ru: 'Ляньюньган',  en: 'Lianyungang', pricePerContainer: 800 },
  ],
};

export const logisticsConfig = {
  async get(): Promise<LogisticsConfig> {
    const stored = await kv.get<LogisticsConfig>(KV_KEY);
    return stored ?? DEFAULT_CONFIG;
  },

  async set(config: LogisticsConfig): Promise<void> {
    await kv.set(KV_KEY, config);
  },
};
