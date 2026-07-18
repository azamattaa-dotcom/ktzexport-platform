export const PRODUCT_LIST = [
  { id: 'flour_feed',  emoji: '🏭', image: '/products/flour_feed.jpg',    fit: 'cover',    from: 'from-amber-100',  to: 'to-orange-100',   border: 'border-amber-300',  text: 'text-amber-800' },
  { id: 'flour_wheat', emoji: '🌾', image: '/products/flour_wheat.png', fit: 'contain',  from: 'from-yellow-50',  to: 'to-amber-100',    border: 'border-yellow-300', text: 'text-yellow-800' },
  { id: 'wheat',       emoji: '🌾', image: null,                        fit: null,       from: 'from-yellow-100', to: 'to-amber-200',    border: 'border-amber-300',  text: 'text-amber-900' },
  { id: 'barley',      emoji: '🌿', image: '/products/barley.jpg',      fit: 'cover',    from: 'from-green-50',   to: 'to-emerald-100',  border: 'border-green-300',  text: 'text-green-800' },
  { id: 'bran',        emoji: '🟤', image: '/products/bran.jpg',        fit: 'cover',    from: 'from-stone-100',  to: 'to-amber-100',    border: 'border-stone-300',  text: 'text-stone-800' },
  { id: 'flaxseed',    emoji: '🫐', image: '/products/flaxseed.jpg',    fit: 'cover',    from: 'from-indigo-50',  to: 'to-blue-100',     border: 'border-indigo-300', text: 'text-indigo-800' },
  { id: 'sunflower',   emoji: '🌻', image: null,                        fit: null,       from: 'from-yellow-100', to: 'to-amber-50',     border: 'border-yellow-300', text: 'text-yellow-900' },
  { id: 'corn',        emoji: '🌽', image: null,                        fit: null,       from: 'from-orange-50',  to: 'to-yellow-100',   border: 'border-orange-300', text: 'text-orange-800' },
] as const;

export type ProductId = (typeof PRODUCT_LIST)[number]['id'];
