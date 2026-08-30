// Lets the same codebase serve two public brands (KTZ Export on ktzexport.com,
// KZT Export on kztexport.com) from two separate deployments, each with its
// own env vars, KV database and domain. The underlying legal entity name
// ("ТОО «KTZ Export»", BIN 260240023256) never changes — only the public
// marketing name/mark shown in the UI does.

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'KTZ Export';
export const BRAND_MARK = process.env.NEXT_PUBLIC_BRAND_MARK ?? 'KTZ';

const DEFAULT_BRAND_NAME = 'KTZ Export';

/**
 * Recursively replaces the default brand name inside a next-intl messages
 * object with the current deployment's BRAND_NAME. Applied once, in
 * i18n/request.ts, so every translated string benefits without duplicating
 * the message JSON files per brand.
 */
export function applyBrandToMessages<T>(messages: T): T {
  if (BRAND_NAME === DEFAULT_BRAND_NAME) return messages;

  function walk(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.split(DEFAULT_BRAND_NAME).join(BRAND_NAME);
    }
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) out[k] = walk(v);
      return out;
    }
    return value;
  }

  return walk(messages) as T;
}
