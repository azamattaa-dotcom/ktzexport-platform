// Pure pricing helpers for container train logistics. These take the current
// LogisticsConfig (borders/stations/rates, editable by admins — see
// lib/logistics-config.ts) as a parameter rather than hardcoding it, so
// rates/stations can change without a code deploy.

import type { LogisticsConfig } from './logistics-config';

export function findBorder(config: LogisticsConfig, borderId: string) {
  return config.borders.find((b) => b.id === borderId);
}

export function findStation(config: LogisticsConfig, stationId: string) {
  return config.stations.find((s) => s.id === stationId);
}

/**
 * Returns the flat USD price for one 40ft container on this border+station,
 * or null if the combination isn't covered (needs a manual quote).
 */
export function getContainerFlatQuote(
  config: LogisticsConfig,
  borderId: string,
  stationId: string
): number | null {
  if (!findBorder(config, borderId)) return null;
  const station = findStation(config, stationId);
  return station ? station.pricePerContainer : null;
}

/**
 * A combined product+logistics total is only meaningful when both legs are
 * priced in USD per metric ton — otherwise we'd be guessing an FX rate or a
 * unit conversion, which is worse than showing nothing.
 */
export function isCombinableWithTonPrice(currency: string, unit: string): boolean {
  return currency === 'USD' && /тонн|ton/i.test(unit);
}

export interface PerTonBreakdown {
  /** (a) Product price, as quoted by the supplier. */
  productPerTon: number;
  /** (b) Fixed logistics overhead per ton — pricePerContainer / referenceTonsPerContainer,
   *  regardless of the actual tonnage a given container ends up carrying. */
  logisticsPerTon: number;
  /** (c) Sum of the two. Actual container/order totals depend on real tonnage,
   *  which this platform does not assume — multiply by real weight separately. */
  totalPerTon: number;
}

/**
 * Per-ton breakdown only. Deliberately does NOT multiply by any assumed
 * tonnage — actual container weight varies and the seller is paid on real
 * weight, so a "per container" total here would misstate their revenue.
 * Logistics is a flat rate per container either way; expressing it per ton
 * is just a fixed reference number for combining with product price.
 */
export function getPerTonBreakdown(
  productPricePerTon: number,
  pricePerContainer: number,
  referenceTonsPerContainer: number
): PerTonBreakdown {
  const logisticsPerTon = pricePerContainer / referenceTonsPerContainer;
  return {
    productPerTon: productPricePerTon,
    logisticsPerTon,
    totalPerTon: productPricePerTon + logisticsPerTon,
  };
}
