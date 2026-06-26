export const PRODUCT_LIST = [
  { id: 'flour_feed',  emoji: '🌾' },
  { id: 'flour_wheat', emoji: '🍞' },
  { id: 'wheat',       emoji: '🌾' },
  { id: 'barley',      emoji: '🌿' },
  { id: 'bran',        emoji: '🟫' },
  { id: 'flaxseed',    emoji: '🔵' },
  { id: 'sunflower',   emoji: '🌻' },
  { id: 'corn',        emoji: '🌽' },
] as const;

export type ProductId = (typeof PRODUCT_LIST)[number]['id'];
