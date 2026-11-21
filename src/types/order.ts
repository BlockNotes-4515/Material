export type FinishId = 'sage' | 'basalt' | 'glacier' | 'cobalt' | 'ember';
export type SizeLabel = '750 ml' | '950 ml' | '1.2 L';

export interface BagItem {
  finish: FinishId;
  size: SizeLabel;
  price: number;
  qty: number;
}

export interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  giftNote: string;
}

export type DeliveryOptionId = 'standard' | 'express' | 'overnight';

export interface DeliveryOption {
  id: DeliveryOptionId;
  label: string;
  eta: string;
  price: number;
  freeThreshold?: number;
}

export interface PromoCodeDef {
  code: string;
  title: string;
  description: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  minSubtotal?: number;
}

export type PaymentMethodId =
  | 'stripe'
  | 'paypal'
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'applepay'
  | 'cod';

export interface WishlistItem {
  finish: FinishId;
  size: SizeLabel;
  price: number;
}

export interface ProductReview {
  id: string;
  author: string;
  finish: FinishId;
  size: SizeLabel;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export interface SavedAddressPreset {
  id: string;
  label: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStageKey =
  | 'placed'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'delivered';

export interface TrackingEvent {
  stage: OrderStageKey;
  title: string;
  detail: string;
  location: string;
  timestamp: string;
}

export interface OrderRecord {
  orderId: string;
  trackingNumber: string;
  createdAt: string;
  estimatedDelivery: string;
  items: BagItem[];
  user: UserDetails;
  deliveryId: DeliveryOptionId;
  paymentMethod: PaymentMethodId;
  paymentLabel: string;
  promoCode: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  currentStageIndex: number; // 0..4
  events: TrackingEvent[];
  cancelled?: boolean;
  returnRequested?: boolean;
}

export const FINISH_META: Record<FinishId, { name: string; dot: string }> = {
  sage: { name: 'Alpine Sage', dot: '#48634B' },
  basalt: { name: 'Basalt Black', dot: '#222624' },
  glacier: { name: 'Glacier Silver', dot: '#B4BDB8' },
  cobalt: { name: 'Alpine Cobalt', dot: '#2F557F' },
  ember: { name: 'Canyon Ember', dot: '#9A4B33' },
};

export const SIZE_OPTIONS: { size: SizeLabel; price: number; scale: number }[] = [
  { size: '750 ml', price: 42, scale: 0.94 },
  { size: '950 ml', price: 48, scale: 1.0 },
  { size: '1.2 L', price: 54, scale: 1.06 },
];

export const SIZE_SPECS: Record<
  SizeLabel,
  {
    height: string;
    diameter: string;
    weight: string;
    cupholder: string;
    bestFor: string;
  }
> = {
  '750 ml': {
    height: '25.8 cm',
    diameter: '7.6 cm',
    weight: '430 g',
    cupholder: 'Fits standard car & bike cages',
    bestFor: 'Daily commutes & light trail runs',
  },
  '950 ml': {
    height: '27.4 cm',
    diameter: '8.4 cm',
    weight: '520 g',
    cupholder: 'Fits oversized SUV & pack pockets',
    bestFor: 'Full-day ridge hikes & studio carry',
  },
  '1.2 L': {
    height: '29.8 cm',
    diameter: '9.1 cm',
    weight: '610 g',
    cupholder: 'Backpack side-sleeve fit',
    bestFor: 'Backcountry treks & shared camp coffee',
  },
};

export const SAVED_ADDRESSES: SavedAddressPreset[] = [
  {
    id: 'home',
    label: 'Home · Boulder',
    address: '1420 Alpine Ridge Blvd',
    apartment: 'Suite 3A',
    city: 'Boulder',
    state: 'CO',
    postalCode: '80302',
    country: 'United States',
  },
  {
    id: 'office',
    label: 'Studio · San Francisco',
    address: '580 Brannan Street',
    apartment: 'Floor 4',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'United States',
  },
];

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    author: 'Aarav Mehta',
    finish: 'sage',
    size: '950 ml',
    rating: 5,
    title: 'Held ice cubes through a 14-hour ridge traverse',
    body: 'Left it in direct afternoon sun on Mount Evans and the water was still genuinely cold at dusk. Zero condensation inside my camera pack.',
    date: 'Nov 12, 2026',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'Elena Lindqvist',
    finish: 'basalt',
    size: '750 ml',
    rating: 5,
    title: 'Matte powder coat still looks brand new',
    body: 'Dropped mine twice on granite gravel. Not a single chip, and the 750 ml fits cleanly inside my commuter cupholder every morning.',
    date: 'Nov 04, 2026',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'Marcus Vance',
    finish: 'cobalt',
    size: '1.2 L',
    rating: 5,
    title: 'Steaming pour-over coffee on chilly camp mornings',
    body: 'Brewed coffee at 6 AM before leaving the cabin and poured a genuinely hot cup at 3 PM. The chug lid thread is super crisp and leakproof.',
    date: 'Oct 28, 2026',
    verified: true,
  },
  {
    id: 'rev-4',
    author: 'Priya Nair',
    finish: 'glacier',
    size: '950 ml',
    rating: 4,
    title: 'Substantial steel feel without metallic aftertaste',
    body: 'Clean brushed finish and great grip even with wet hands. Slightly heavier than single-wall bottles, which is expected for this insulation.',
    date: 'Oct 19, 2026',
    verified: true,
  },
];

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How long does shipping take and when is it free?',
    a: 'Orders placed before 3 PM MT ship the same day from our Boulder hub. Alpine Ground (3–5 business days) is automatically free on orders $75+, or apply promo code FREESHIP at checkout.',
  },
  {
    q: 'Are Material Flasks dishwasher safe?',
    a: 'The leakproof chug cap is top-rack dishwasher safe. We recommend warm soapy hand-washing for the powder-coated 18/8 stainless vessel to preserve the matte finish for decades.',
  },
  {
    q: 'What does the Lifetime Replacement Warranty cover?',
    a: 'Every Material Flask is backed against vacuum seal failure, thread defects, or manufacturing faults for life. If your flask ever stops insulating, we replace it free of charge.',
  },
  {
    q: 'Can I cancel or return my order?',
    a: 'Orders can be cancelled directly from Track Order before carrier pickup. Delivered flasks carry a 30-day unused return and instant exchange guarantee.',
  },
];

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'standard',
    label: 'Alpine Ground',
    eta: '3–5 business days',
    price: 6,
    freeThreshold: 75,
  },
  {
    id: 'express',
    label: 'Express Trail Courier',
    eta: '1–2 business days',
    price: 14,
  },
  {
    id: 'overnight',
    label: 'Priority Overnight Air',
    eta: 'Next business day',
    price: 24,
  },
];

export const PROMO_CODES: PromoCodeDef[] = [
  {
    code: 'ALPINE15',
    title: '15% Off Order',
    description: 'Save 15% on any Material Flask order',
    type: 'percent',
    value: 15,
  },
  {
    code: 'SUMMIT20',
    title: '20% Off $80+',
    description: '20% discount on orders $80 or more',
    type: 'percent',
    value: 20,
    minSubtotal: 80,
  },
  {
    code: 'FIRST10',
    title: '$10 Off',
    description: 'Flat $10 instant credit on your order',
    type: 'fixed',
    value: 10,
    minSubtotal: 30,
  },
  {
    code: 'FREESHIP',
    title: 'Free Shipping',
    description: 'Waives Ground or Express shipping fees',
    type: 'free_shipping',
    value: 0,
  },
];

export const ORDER_STAGES: {
  key: OrderStageKey;
  label: string;
  defaultDetail: string;
  defaultLocation: string;
}[] = [
  {
    key: 'placed',
    label: 'Order Confirmed',
    defaultDetail: 'Payment authorized and order queued for fulfillment.',
    defaultLocation: 'Boulder Alpine Hub',
  },
  {
    key: 'packed',
    label: 'Packed in Box',
    defaultDetail: 'Flask inspected, sleeved, and sealed inside recycled craft box.',
    defaultLocation: 'Boulder Fulfillment Center',
  },
  {
    key: 'shipped',
    label: 'Loaded on Truck',
    defaultDetail: 'Parcel scanned and loaded onto outbound electric courier.',
    defaultLocation: 'Denver Regional Depot',
  },
  {
    key: 'in_transit',
    label: 'Out for Delivery',
    defaultDetail: 'Delivery truck is en route to your destination address.',
    defaultLocation: 'Local Courier Route',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    defaultDetail: 'Package handed off safely at your delivery address.',
    defaultLocation: 'Destination',
  },
];

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  appliedPromo: PromoCodeDef | null;
}

export function validatePromoCode(
  rawCode: string,
  subtotal: number
): { valid: true; promo: PromoCodeDef } | { valid: false; error: string } {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: 'Enter a promo code to apply.' };
  }
  const found = PROMO_CODES.find((p) => p.code === normalized);
  if (!found) {
    return {
      valid: false,
      error: `Code "${normalized}" is invalid. Try ALPINE15, SUMMIT20, FIRST10, or FREESHIP.`,
    };
  }
  if (found.minSubtotal && subtotal < found.minSubtotal) {
    return {
      valid: false,
      error: `${found.code} requires a subtotal of at least $${found.minSubtotal}.`,
    };
  }
  return { valid: true, promo: found };
}

export function calculatePriceBreakdown(
  bag: BagItem[],
  promoCode: string | null,
  deliveryId: DeliveryOptionId
): PriceBreakdown {
  const subtotal = bag.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery =
    DELIVERY_OPTIONS.find((d) => d.id === deliveryId) ?? DELIVERY_OPTIONS[0];

  let appliedPromo: PromoCodeDef | null = null;
  if (promoCode) {
    const res = validatePromoCode(promoCode, subtotal);
    if (res.valid) {
      appliedPromo = res.promo;
    }
  }

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discount = Math.round(subtotal * (appliedPromo.value / 100) * 100) / 100;
    } else if (appliedPromo.type === 'fixed') {
      discount = Math.min(subtotal, appliedPromo.value);
    }
  }

  let shippingCost = delivery.price;
  if (delivery.freeThreshold && subtotal >= delivery.freeThreshold) {
    shippingCost = 0;
  }
  if (appliedPromo?.type === 'free_shipping' && delivery.id !== 'overnight') {
    shippingCost = 0;
  }

  const taxableBase = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableBase * 0.08 * 100) / 100;
  const total = Math.round((taxableBase + shippingCost + tax) * 100) / 100;

  return {
    subtotal,
    discount,
    shippingCost,
    tax,
    total,
    appliedPromo,
  };
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, '')}`;
}

export function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MF-${num}`;
}

export function generateTrackingNumber(): string {
  const seg = Math.floor(10000000 + Math.random() * 90000000);
  return `ALP-${seg}-US`;
}

export function formatShortTimestamp(date = new Date()): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function computeEstimatedDelivery(deliveryId: DeliveryOptionId): string {
  const days = deliveryId === 'overnight' ? 1 : deliveryId === 'express' ? 2 : 4;
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
