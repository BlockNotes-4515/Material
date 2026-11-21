import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Lock,
  Mail,
  MapPin,
  Maximize2,
  Minimize2,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import {
  BagItem,
  DELIVERY_OPTIONS,
  DeliveryOptionId,
  FINISH_META,
  ORDER_STAGES,
  OrderRecord,
  PROMO_CODES,
  PaymentMethodId,
  SAVED_ADDRESSES,
  UserDetails,
  calculatePriceBreakdown,
  computeEstimatedDelivery,
  formatMoney,
  formatShortTimestamp,
  generateOrderId,
  generateTrackingNumber,
  validatePromoCode,
} from '../types/order';
import { EmailReceiptView } from './EmailReceiptView';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import {
  ApplePayLogo,
  CardNetworkBadges,
  CodBadgeLogo,
  GooglePayLogo,
  PayPalLogo,
  PaytmLogo,
  PhonePeLogo,
  StripeLogo,
} from './PaymentLogos';

interface CheckoutModalProps {
  isOpen: boolean;
  bag: BagItem[];
  promoCode: string | null;
  userDetails: UserDetails;
  totalUserOrders: number;
  onClose: () => void;
  onUpdateQty: (idx: number, delta: number) => void;
  onApplyPromo: (code: string | null) => void;
  onSaveUserDetails: (details: UserDetails) => void;
  onOrderComplete: (order: OrderRecord) => void;
  onAdvanceOrderStage: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (orderId: string) => void;
  completedOrder: OrderRecord | null;
}

type CheckoutStep = 'details' | 'payment' | 'confirmed';
type ConfirmedTab = 'email' | 'track';

const PAYMENT_PROVIDERS: {
  id: PaymentMethodId;
  name: string;
  subtitle: string;
  logo: React.ReactNode;
}[] = [
  {
    id: 'stripe',
    name: 'Stripe Card',
    subtitle: 'Credit / Debit',
    logo: <StripeLogo />,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    subtitle: 'Express Account',
    logo: <PayPalLogo />,
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    subtitle: 'UPI & Saved Cards',
    logo: <GooglePayLogo />,
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    subtitle: 'UPI / QR Scan',
    logo: <PhonePeLogo />,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    subtitle: 'Wallet & UPI',
    logo: <PaytmLogo />,
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    subtitle: 'One-Tap Biometric',
    logo: <ApplePayLogo />,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    subtitle: 'Pay at Doorstep',
    logo: <CodBadgeLogo />,
  },
];

export function downloadOrderInvoice(order: OrderRecord) {
  const lines = [
    '========================================',
    '           MATERIAL FLASK INVOICE       ',
    '========================================',
    `Order ID:        ${order.orderId}`,
    `Tracking ID:     ${order.trackingNumber}`,
    `Date:            ${order.createdAt}`,
    `Estimated ETA:   ${order.estimatedDelivery}`,
    `Payment Method:  ${order.paymentLabel}`,
    '',
    'CUSTOMER & SHIPPING DETAILS',
    `Name:            ${order.user.fullName}`,
    `Email:           ${order.user.email}`,
    `Phone:           ${order.user.phone}`,
    `Address:         ${order.user.address}${order.user.apartment ? `, ${order.user.apartment}` : ''}`,
    `                 ${order.user.city}, ${order.user.state} ${order.user.postalCode}, ${order.user.country}`,
    order.user.giftNote ? `Note:            ${order.user.giftNote}` : '',
    '',
    'ITEMS',
    ...order.items.map(
      (it) =>
        ` - Material Flask (${FINISH_META[it.finish].name}, ${it.size}) x${it.qty}  =  ${formatMoney(
          it.price * it.qty
        )}`
    ),
    '',
    `Subtotal:        ${formatMoney(order.subtotal)}`,
    order.discount > 0
      ? `Promo (${order.promoCode}): -${formatMoney(order.discount)}`
      : '',
    `Shipping:        ${order.shippingCost === 0 ? 'Free' : formatMoney(order.shippingCost)}`,
    `Tax (8%):        ${formatMoney(order.tax)}`,
    `TOTAL:           ${formatMoney(order.total)}`,
    '========================================',
  ]
    .filter(Boolean)
    .join('\n');

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Material-Invoice-${order.orderId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  bag,
  promoCode,
  userDetails,
  totalUserOrders,
  onClose,
  onUpdateQty,
  onApplyPromo,
  onSaveUserDetails,
  onOrderComplete,
  onAdvanceOrderStage,
  onCancelOrder,
  onRequestReturn,
  completedOrder,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [step, setStep] = useState<CheckoutStep>('details');
  const [confirmedTab, setConfirmedTab] = useState<ConfirmedTab>('email');

  const [form, setForm] = useState<UserDetails>(userDetails);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof UserDetails, string>>
  >({});
  const [deliveryId, setDeliveryId] = useState<DeliveryOptionId>('standard');

  // Promo code state
  const [promoInput, setPromoInput] = useState<string>(promoCode ?? '');
  const [promoMsg, setPromoMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('stripe');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardName, setCardName] = useState<string>(userDetails.fullName || 'Dhruv Dhayal');
  const [cardExpiry, setCardExpiry] = useState<string>('08/29');
  const [cardCvv, setCardCvv] = useState<string>('842');
  const [paypalEmail, setPaypalEmail] = useState<string>(userDetails.email || 'dhayaldhruv271@gmail.com');
  const [upiId, setUpiId] = useState<string>('dhruv@okaxis');
  const [upiMode, setUpiMode] = useState<'id' | 'qr'>('id');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsMaximized(true);
      setForm(userDetails);
      setCardName(userDetails.fullName || 'Dhruv Dhayal');
      setPaypalEmail(userDetails.email || 'dhayaldhruv271@gmail.com');
      setPromoInput(promoCode ?? '');
      setPromoMsg(null);
      setPaymentError(null);
      setIsProcessing(false);
      if (completedOrder) {
        setStep('confirmed');
      } else {
        setStep('details');
      }
    }
  }, [isOpen, completedOrder, userDetails, promoCode]);

  if (!isOpen) return null;

  const breakdown = calculatePriceBreakdown(bag, promoCode, deliveryId);
  const freeThresholdRemaining = Math.max(0, 75 - breakdown.subtotal);

  const handleFieldChange = (field: keyof UserDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const applySavedAddress = (presetId: string) => {
    const found = SAVED_ADDRESSES.find((a) => a.id === presetId);
    if (!found) return;
    setForm((prev) => ({
      ...prev,
      address: found.address,
      apartment: found.apartment,
      city: found.city,
      state: found.state,
      postalCode: found.postalCode,
      country: found.country,
    }));
    setFormErrors((prev) => ({
      ...prev,
      address: undefined,
      city: undefined,
      state: undefined,
      postalCode: undefined,
    }));
  };

  const validateDetails = (): boolean => {
    const errs: Partial<Record<keyof UserDetails, string>> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
      errs.phone = 'Enter a valid phone number.';
    }
    if (!form.address.trim()) errs.address = 'Street address is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    if (!form.state.trim()) errs.state = 'State / Region is required.';
    if (!form.postalCode.trim()) errs.postalCode = 'Postal code is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    onSaveUserDetails(form);
    if (!cardName.trim()) setCardName(form.fullName);
    if (!paypalEmail.trim()) setPaypalEmail(form.email);
    setStep('payment');
  };

  const handlePromoSubmit = (codeToTry?: string) => {
    const raw = (codeToTry ?? promoInput).trim().toUpperCase();
    const res = validatePromoCode(raw, breakdown.subtotal);
    if (!res.valid) {
      setPromoMsg({ type: 'err', text: res.error });
      return;
    }
    setPromoInput(res.promo.code);
    onApplyPromo(res.promo.code);
    setPromoMsg({
      type: 'ok',
      text: `${res.promo.code} applied (${res.promo.title}).`,
    });
  };

  const handleRemovePromo = () => {
    setPromoInput('');
    onApplyPromo(null);
    setPromoMsg(null);
  };

  const formatCardNumberInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g) ?? [];
    setCardNumber(groups.join(' '));
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const fillDemoCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardName(form.fullName || 'Dhruv Dhayal');
    setCardExpiry('08/29');
    setCardCvv('842');
    setPaymentError(null);
  };

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentMethod === 'stripe') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13) {
        setPaymentError('Enter a valid card number (or click Fill Demo Card).');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setPaymentError('Enter expiry in MM/YY format.');
        return;
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        setPaymentError('Enter a 3 or 4 digit CVV.');
        return;
      }
    } else if (paymentMethod === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail.trim())) {
        setPaymentError('Enter a valid PayPal account email.');
        return;
      }
    } else if (
      (paymentMethod === 'gpay' ||
        paymentMethod === 'phonepe' ||
        paymentMethod === 'paytm') &&
      upiMode === 'id'
    ) {
      if (!upiId.includes('@')) {
        setPaymentError('Enter a valid UPI ID (e.g., name@okaxis) or switch to QR Scan.');
        return;
      }
    }

    setIsProcessing(true);

    window.setTimeout(() => {
      const last4 = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
      const paymentLabel =
        paymentMethod === 'stripe'
          ? `Stripe Card •••• ${last4}`
          : paymentMethod === 'paypal'
          ? `PayPal (${paypalEmail})`
          : paymentMethod === 'gpay'
          ? `Google Pay (${upiMode === 'qr' ? 'QR Verified' : upiId})`
          : paymentMethod === 'phonepe'
          ? `PhonePe (${upiMode === 'qr' ? 'QR Verified' : upiId})`
          : paymentMethod === 'paytm'
          ? `Paytm (${upiMode === 'qr' ? 'QR Verified' : upiId})`
          : paymentMethod === 'applepay'
          ? 'Apple Pay Express'
          : 'Cash on Delivery (COD)';

      const nowStr = formatShortTimestamp();
      const newOrder: OrderRecord = {
        orderId: generateOrderId(),
        trackingNumber: generateTrackingNumber(),
        createdAt: nowStr,
        estimatedDelivery: computeEstimatedDelivery(deliveryId),
        items: [...bag],
        user: { ...form },
        deliveryId,
        paymentMethod,
        paymentLabel,
        promoCode: breakdown.appliedPromo?.code ?? null,
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        shippingCost: breakdown.shippingCost,
        tax: breakdown.tax,
        total: breakdown.total,
        currentStageIndex: 1,
        events: [
          {
            stage: ORDER_STAGES[0].key,
            title: ORDER_STAGES[0].label,
            detail: ORDER_STAGES[0].defaultDetail,
            location: ORDER_STAGES[0].defaultLocation,
            timestamp: nowStr,
          },
          {
            stage: ORDER_STAGES[1].key,
            title: ORDER_STAGES[1].label,
            detail: ORDER_STAGES[1].defaultDetail,
            location: ORDER_STAGES[1].defaultLocation,
            timestamp: nowStr,
          },
        ],
      };

      setIsProcessing(false);
      setConfirmedTab('email');
      setStep('confirmed');
      onOrderComplete(newOrder);
    }, 1250);
  };

  const isUpiProvider =
    paymentMethod === 'gpay' ||
    paymentMethod === 'phonepe' ||
    paymentMethod === 'paytm';

  return (
    <div
      className="checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Material Flask Checkout"
      data-lenis-prevent
    >
      <div className={`checkout-window${isMaximized ? ' is-maximized' : ''}`}>
        {/* Top Window Chrome Bar */}
        <header className="checkout-topbar">
          <div className="checkout-topbar-left">
            <div className="checkout-brand">
              <svg width="20" height="13" viewBox="0 0 28 18" fill="none" aria-hidden="true">
                <path
                  d="M2 16L10.5 3L16 11.5L19.5 6.5L26 16H2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Material Checkout</span>
            </div>

            <nav className="checkout-stepper" aria-label="Checkout steps">
              <button
                type="button"
                className={`step-crumb${step === 'details' ? ' is-active' : ''}${
                  step === 'payment' || step === 'confirmed' ? ' is-done' : ''
                }`}
                disabled={step === 'confirmed'}
                onClick={() => step === 'payment' && setStep('details')}
              >
                <span className="step-num">1</span>
                <span>User Details</span>
              </button>
              <span className="step-sep" aria-hidden="true">/</span>
              <button
                type="button"
                className={`step-crumb${step === 'payment' ? ' is-active' : ''}${
                  step === 'confirmed' ? ' is-done' : ''
                }`}
                disabled={step !== 'payment'}
              >
                <span className="step-num">2</span>
                <span>Payment</span>
              </button>
              <span className="step-sep" aria-hidden="true">/</span>
              <span
                className={`step-crumb${step === 'confirmed' ? ' is-active' : ''}`}
              >
                <span className="step-num">3</span>
                <span>Email &amp; Tracking</span>
              </span>
            </nav>
          </div>

          <div className="checkout-topbar-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={isMaximized ? 'Restore window size' : 'Maximize window'}
              title={isMaximized ? 'Restore window size' : 'Maximize window'}
              onClick={() => setIsMaximized((prev) => !prev)}
            >
              {isMaximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close checkout"
              title="Close checkout"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="checkout-scroll-body" data-lenis-prevent>
          {step === 'confirmed' && completedOrder ? (
            <div className="checkout-confirmed-wrap">
              <div className="confirmed-banner">
                <div className="confirmed-banner-left">
                  <div className="confirmed-check-icon" aria-hidden="true">
                    <PackageCheck size={24} />
                  </div>
                  <div>
                    <div className="confirmed-kicker">
                      Order {completedOrder.orderId} · Dispatched to{' '}
                      {completedOrder.user.email}
                    </div>
                    <h2 className="confirmed-title">
                      {completedOrder.cancelled
                        ? 'Order cancelled — refund initiated.'
                        : 'Payment successful — your order is packed & rolling!'}
                    </h2>
                  </div>
                </div>

                <div className="confirmed-actions-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => downloadOrderInvoice(completedOrder)}
                  >
                    <Download size={14} />
                    <span>Invoice</span>
                  </button>
                  <div className="confirmed-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={confirmedTab === 'email'}
                      className={`seg-btn${confirmedTab === 'email' ? ' is-active' : ''}`}
                      onClick={() => setConfirmedTab('email')}
                    >
                      <Mail size={15} />
                      <span>Email Message</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={confirmedTab === 'track'}
                      className={`seg-btn${confirmedTab === 'track' ? ' is-active' : ''}`}
                      onClick={() => setConfirmedTab('track')}
                    >
                      <Truck size={15} />
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>
              </div>

              {confirmedTab === 'email' ? (
                <EmailReceiptView
                  order={completedOrder}
                  onTrackOrder={() => setConfirmedTab('track')}
                />
              ) : (
                <OrderTrackingTimeline
                  order={completedOrder}
                  totalUserOrders={totalUserOrders}
                  onAdvanceStage={onAdvanceOrderStage}
                  onCancelOrder={onCancelOrder}
                  onRequestReturn={onRequestReturn}
                  onDownloadInvoice={() => downloadOrderInvoice(completedOrder)}
                  onOpenEmail={() => setConfirmedTab('email')}
                />
              )}
            </div>
          ) : (
            <div className="checkout-main-grid">
              {/* LEFT COLUMN: User Details OR Payment Details */}
              <div className="checkout-form-col">
                {step === 'details' ? (
                  <form onSubmit={handleProceedToPayment} className="checkout-form" noValidate>
                    <div className="checkout-section-head">
                      <h2 className="checkout-heading">Shipping &amp; User Details</h2>
                      <p className="checkout-sub">
                        Enter your contact and delivery address, or pick a saved address
                        below. Your visual dispatch receipt will be sent to your email.
                      </p>

                      {/* Saved Address Quick Presets */}
                      <div className="saved-address-row">
                        <span className="saved-addr-label">
                          <MapPin size={13} />
                          <span>Saved addresses:</span>
                        </span>
                        {SAVED_ADDRESSES.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`drawer-promo-hint-btn${
                              form.address === preset.address ? ' is-active' : ''
                            }`}
                            onClick={() => applySavedAddress(preset.id)}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-name">
                          Full Name
                        </label>
                        <input
                          id="chk-name"
                          type="text"
                          className={`field-input${formErrors.fullName ? ' has-error' : ''}`}
                          placeholder="Dhruv Dhayal"
                          value={form.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        />
                        {formErrors.fullName && (
                          <span className="field-error">{formErrors.fullName}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-email">
                          Email Address (receives order confirmation)
                        </label>
                        <input
                          id="chk-email"
                          type="email"
                          className={`field-input${formErrors.email ? ' has-error' : ''}`}
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                        />
                        {formErrors.email && (
                          <span className="field-error">{formErrors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-phone">
                          Phone Number
                        </label>
                        <input
                          id="chk-phone"
                          type="tel"
                          className={`field-input${formErrors.phone ? ' has-error' : ''}`}
                          placeholder="+1 (555) 234-8910"
                          value={form.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                        />
                        {formErrors.phone && (
                          <span className="field-error">{formErrors.phone}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-country">
                          Country / Region
                        </label>
                        <select
                          id="chk-country"
                          className="field-input"
                          value={form.country}
                          onChange={(e) => handleFieldChange('country', e.target.value)}
                        >
                          <option value="United States">United States</option>
                          <option value="India">India</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Germany">Germany</option>
                          <option value="Japan">Japan</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-address">
                          Street Address
                        </label>
                        <input
                          id="chk-address"
                          type="text"
                          className={`field-input${formErrors.address ? ' has-error' : ''}`}
                          placeholder="1420 Alpine Ridge Blvd"
                          value={form.address}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                        />
                        {formErrors.address && (
                          <span className="field-error">{formErrors.address}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-apt">
                          Apartment, Suite, Unit (Optional)
                        </label>
                        <input
                          id="chk-apt"
                          type="text"
                          className="field-input"
                          placeholder="Suite 3A"
                          value={form.apartment}
                          onChange={(e) => handleFieldChange('apartment', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-grid-3">
                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-city">
                          City
                        </label>
                        <input
                          id="chk-city"
                          type="text"
                          className={`field-input${formErrors.city ? ' has-error' : ''}`}
                          placeholder="Boulder"
                          value={form.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                        />
                        {formErrors.city && (
                          <span className="field-error">{formErrors.city}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-state">
                          State / Province
                        </label>
                        <input
                          id="chk-state"
                          type="text"
                          className={`field-input${formErrors.state ? ' has-error' : ''}`}
                          placeholder="CO"
                          value={form.state}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                        />
                        {formErrors.state && (
                          <span className="field-error">{formErrors.state}</span>
                        )}
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="chk-zip">
                          Postal Code
                        </label>
                        <input
                          id="chk-zip"
                          type="text"
                          className={`field-input${formErrors.postalCode ? ' has-error' : ''}`}
                          placeholder="80302"
                          value={form.postalCode}
                          onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        />
                        {formErrors.postalCode && (
                          <span className="field-error">{formErrors.postalCode}</span>
                        )}
                      </div>
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="checkout-subblock">
                      <span className="field-label">Delivery Speed</span>
                      <div className="delivery-options-grid">
                        {DELIVERY_OPTIONS.map((opt) => {
                          const isFreeByThreshold =
                            opt.freeThreshold && breakdown.subtotal >= opt.freeThreshold;
                          const isFreeByPromo =
                            breakdown.appliedPromo?.type === 'free_shipping' &&
                            opt.id !== 'overnight';
                          const effectiveCost =
                            isFreeByThreshold || isFreeByPromo ? 0 : opt.price;
                          const active = deliveryId === opt.id;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              className={`delivery-card${active ? ' is-active' : ''}`}
                              onClick={() => setDeliveryId(opt.id)}
                            >
                              <div className="delivery-card-top">
                                <span className="delivery-card-name">{opt.label}</span>
                                <span className="delivery-card-price mono-num">
                                  {effectiveCost === 0 ? 'Free' : formatMoney(effectiveCost)}
                                </span>
                              </div>
                              <span className="delivery-card-eta">{opt.eta}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="chk-note">
                        Laser Engraving / Delivery Note (Optional)
                      </label>
                      <input
                        id="chk-note"
                        type="text"
                        className="field-input"
                        placeholder="Leave parcel with front desk or include gift message"
                        value={form.giftNote}
                        onChange={(e) => handleFieldChange('giftNote', e.target.value)}
                      />
                    </div>

                    <div className="checkout-form-footer">
                      <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={bag.length === 0}
                      >
                        Continue to Payment Details
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePayNow} className="checkout-form" noValidate>
                    <div className="checkout-section-head">
                      <button
                        type="button"
                        className="back-link-btn"
                        onClick={() => setStep('details')}
                      >
                        <ArrowLeft size={15} />
                        <span>Back to User Details</span>
                      </button>
                      <h2 className="checkout-heading">Payment Details</h2>
                      <p className="checkout-sub">
                        Delivering to <strong>{form.fullName}</strong> ({form.email}) at{' '}
                        {form.address}, {form.city}. Select a payment provider below to
                        complete your simulated checkout.
                      </p>
                    </div>

                    {/* Branded Payment Provider Grid */}
                    <div
                      className="payment-providers-grid"
                      role="radiogroup"
                      aria-label="Payment provider"
                    >
                      {PAYMENT_PROVIDERS.map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          role="radio"
                          aria-checked={paymentMethod === prov.id}
                          className={`payment-provider-card${
                            paymentMethod === prov.id ? ' is-active' : ''
                          }`}
                          onClick={() => {
                            setPaymentMethod(prov.id);
                            setPaymentError(null);
                          }}
                        >
                          <div className="provider-logo-slot">{prov.logo}</div>
                          <div className="provider-text">
                            <span className="provider-name">{prov.name}</span>
                            <span className="provider-sub">{prov.subtitle}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Provider Form Body */}
                    <div className="payment-panel">
                      {paymentMethod === 'stripe' && (
                        <div className="payment-panel-inner">
                          <div className="payment-panel-head">
                            <div className="payment-head-brand">
                              <StripeLogo />
                              <CardNetworkBadges />
                            </div>
                            <button
                              type="button"
                              className="text-action-btn"
                              onClick={fillDemoCard}
                            >
                              Fill Demo Card
                            </button>
                          </div>

                          <div className="field-group">
                            <label className="field-label" htmlFor="pay-card-num">
                              Card Number
                            </label>
                            <input
                              id="pay-card-num"
                              type="text"
                              inputMode="numeric"
                              className="field-input mono-num"
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              onChange={(e) => formatCardNumberInput(e.target.value)}
                            />
                          </div>

                          <div className="form-grid-3">
                            <div className="field-group">
                              <label className="field-label" htmlFor="pay-card-name">
                                Name on Card
                              </label>
                              <input
                                id="pay-card-name"
                                type="text"
                                className="field-input"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                              />
                            </div>
                            <div className="field-group">
                              <label className="field-label" htmlFor="pay-card-exp">
                                Expiry (MM/YY)
                              </label>
                              <input
                                id="pay-card-exp"
                                type="text"
                                inputMode="numeric"
                                className="field-input mono-num"
                                placeholder="08/29"
                                value={cardExpiry}
                                onChange={(e) => formatExpiryInput(e.target.value)}
                              />
                            </div>
                            <div className="field-group">
                              <label className="field-label" htmlFor="pay-card-cvv">
                                Security Code
                              </label>
                              <input
                                id="pay-card-cvv"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                className="field-input mono-num"
                                placeholder="842"
                                value={cardCvv}
                                onChange={(e) =>
                                  setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'paypal' && (
                        <div className="payment-panel-inner">
                          <div className="payment-panel-head">
                            <div className="payment-head-brand">
                              <PayPalLogo />
                              <span>PayPal Express Checkout</span>
                            </div>
                          </div>
                          <div className="field-group">
                            <label className="field-label" htmlFor="pay-paypal-email">
                              PayPal Account Email
                            </label>
                            <input
                              id="pay-paypal-email"
                              type="email"
                              className="field-input"
                              value={paypalEmail}
                              onChange={(e) => setPaypalEmail(e.target.value)}
                            />
                          </div>
                          <p className="cod-info-text">
                            Simulated PayPal Buyer Protection authorization for{' '}
                            <strong className="mono-num">{formatMoney(breakdown.total)}</strong>.
                          </p>
                        </div>
                      )}

                      {isUpiProvider && (
                        <div className="payment-panel-inner">
                          <div className="payment-panel-head">
                            <div className="payment-head-brand">
                              {paymentMethod === 'gpay' && <GooglePayLogo />}
                              {paymentMethod === 'phonepe' && <PhonePeLogo />}
                              {paymentMethod === 'paytm' && <PaytmLogo />}
                              <span>Instant UPI &amp; QR Authorization</span>
                            </div>
                            <div className="upi-mode-switch">
                              <button
                                type="button"
                                className={`drawer-promo-hint-btn${
                                  upiMode === 'id' ? ' is-active' : ''
                                }`}
                                onClick={() => setUpiMode('id')}
                              >
                                UPI ID
                              </button>
                              <button
                                type="button"
                                className={`drawer-promo-hint-btn${
                                  upiMode === 'qr' ? ' is-active' : ''
                                }`}
                                onClick={() => setUpiMode('qr')}
                              >
                                <QrCode size={12} /> Scan QR
                              </button>
                            </div>
                          </div>

                          {upiMode === 'id' ? (
                            <div className="field-group">
                              <label className="field-label" htmlFor="pay-upi-id">
                                Enter UPI ID / VPA
                              </label>
                              <input
                                id="pay-upi-id"
                                type="text"
                                className="field-input mono-num"
                                placeholder="name@okaxis"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="upi-qr-box">
                              <div className="upi-qr-svg" aria-hidden="true">
                                <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
                                  <rect width="92" height="92" rx="8" fill="#FFFFFF" />
                                  <rect x="8" y="8" width="24" height="24" rx="3" stroke="#111614" strokeWidth="4" />
                                  <rect x="15" y="15" width="10" height="10" fill="#111614" />
                                  <rect x="60" y="8" width="24" height="24" rx="3" stroke="#111614" strokeWidth="4" />
                                  <rect x="67" y="15" width="10" height="10" fill="#111614" />
                                  <rect x="8" y="60" width="24" height="24" rx="3" stroke="#111614" strokeWidth="4" />
                                  <rect x="15" y="67" width="10" height="10" fill="#111614" />
                                  <rect x="40" y="10" width="8" height="8" fill="#111614" />
                                  <rect x="40" y="24" width="12" height="8" fill="#111614" />
                                  <rect x="10" y="40" width="14" height="8" fill="#111614" />
                                  <rect x="38" y="38" width="16" height="16" rx="2" fill="var(--accent)" />
                                  <rect x="62" y="42" width="20" height="8" fill="#111614" />
                                  <rect x="40" y="62" width="10" height="20" fill="#111614" />
                                  <rect x="58" y="60" width="12" height="10" fill="#111614" />
                                  <rect x="74" y="72" width="10" height="12" fill="#111614" />
                                </svg>
                              </div>
                              <div>
                                <div className="upi-qr-title">
                                  Scan with{' '}
                                  {paymentMethod === 'gpay'
                                    ? 'Google Pay'
                                    : paymentMethod === 'phonepe'
                                    ? 'PhonePe'
                                    : 'Paytm'}
                                </div>
                                <p className="cod-info-text">
                                  Amount{' '}
                                  <strong className="mono-num">
                                    {formatMoney(breakdown.total)}
                                  </strong>{' '}
                                  pre-filled. Click the Pay button below to confirm simulated
                                  approval.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {paymentMethod === 'applepay' && (
                        <div className="payment-panel-inner">
                          <div className="payment-panel-head">
                            <div className="payment-head-brand">
                              <ApplePayLogo />
                              <span>Apple Pay Biometric Checkout</span>
                            </div>
                          </div>
                          <p className="cod-info-text">
                            Instant simulated Face ID / Touch ID authorization for{' '}
                            <strong className="mono-num">{formatMoney(breakdown.total)}</strong>{' '}
                            billed to {form.fullName}.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'cod' && (
                        <div className="payment-panel-inner">
                          <div className="payment-panel-head">
                            <div className="payment-head-brand">
                              <CodBadgeLogo />
                              <span>Cash on Delivery (COD)</span>
                            </div>
                          </div>
                          <p className="cod-info-text">
                            Pay <strong className="mono-num">{formatMoney(breakdown.total)}</strong>{' '}
                            in cash or UPI at your doorstep upon delivery to{' '}
                            <strong>{form.fullName}</strong> at {form.address}, {form.city}.
                          </p>
                        </div>
                      )}

                      {paymentError && (
                        <div className="payment-error-box" role="alert">
                          {paymentError}
                        </div>
                      )}
                    </div>

                    <div className="payment-trust-line">
                      <ShieldCheck size={16} />
                      <span>
                        256-bit encrypted demo checkout · Supports Stripe, PayPal, Google Pay,
                        PhonePe, Paytm, Apple Pay &amp; COD
                      </span>
                    </div>

                    <div className="checkout-form-footer">
                      <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isProcessing || bag.length === 0}
                      >
                        <Lock size={16} />
                        {isProcessing
                          ? 'Authorizing & Packing Order...'
                          : paymentMethod === 'cod'
                          ? `Confirm COD Order · ${formatMoney(breakdown.total)}`
                          : `Pay ${formatMoney(breakdown.total)} & Place Order`}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN: Order Summary & Promo Code Engine */}
              <aside className="checkout-summary-col">
                <div className="summary-card">
                  <div className="summary-card-head">
                    <h3 className="summary-title">Order Summary</h3>
                    <span className="summary-count mono-num">
                      {bag.reduce((s, i) => s + i.qty, 0)} item(s)
                    </span>
                  </div>

                  {/* Free Shipping Progress Bar */}
                  <div className="shipping-meter-box">
                    <div className="shipping-meter-text">
                      {freeThresholdRemaining === 0
                        ? 'Free Alpine Ground shipping unlocked'
                        : `Add ${formatMoney(freeThresholdRemaining)} more for Free Alpine Ground shipping`}
                    </div>
                    <div className="shipping-meter-bar">
                      <div
                        className="shipping-meter-fill"
                        style={{
                          width: `${Math.min(100, (breakdown.subtotal / 75) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="summary-items-list">
                    {bag.map((item, idx) => (
                      <div key={`${item.finish}-${item.size}`} className="summary-item-row">
                        <img
                          src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-order-cutout.webp"
                          alt="Material Flask"
                          className="bag-item-thumb"
                          data-finish={item.finish}
                        />
                        <div className="summary-item-info">
                          <div className="summary-item-name">Material Flask</div>
                          <div className="summary-item-meta">
                            {FINISH_META[item.finish].name} · {item.size}
                          </div>
                          <div className="bag-qty-row">
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label="Decrease quantity"
                              onClick={() => onUpdateQty(idx, -1)}
                            >
                              -
                            </button>
                            <span className="bag-qty mono-num">{item.qty}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label="Increase quantity"
                              onClick={() => onUpdateQty(idx, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="summary-item-price mono-num">
                          {formatMoney(item.price * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Section */}
                  <div className="promo-box">
                    <label className="field-label" htmlFor="chk-promo-input">
                      Promo Code
                    </label>
                    <div className="promo-input-row">
                      <input
                        id="chk-promo-input"
                        type="text"
                        className="field-input mono-num"
                        placeholder="Enter code (e.g. ALPINE15)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      />
                      {breakdown.appliedPromo ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={handleRemovePromo}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePromoSubmit()}
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {promoMsg && (
                      <div
                        className={`promo-feedback${
                          promoMsg.type === 'ok' ? ' is-ok' : ' is-err'
                        }`}
                      >
                        {promoMsg.text}
                      </div>
                    )}

                    {/* Available Promo Codes Quick Selector */}
                    <div className="promo-catalog">
                      <div className="promo-catalog-label">
                        <Tag size={13} />
                        <span>Available promo codes</span>
                      </div>
                      <div className="promo-chips-grid">
                        {PROMO_CODES.map((p) => {
                          const isApplied = breakdown.appliedPromo?.code === p.code;
                          const isEligible =
                            !p.minSubtotal || breakdown.subtotal >= p.minSubtotal;
                          return (
                            <button
                              key={p.code}
                              type="button"
                              className={`promo-chip-btn${isApplied ? ' is-active' : ''}`}
                              disabled={!isEligible && !isApplied}
                              onClick={() =>
                                isApplied ? handleRemovePromo() : handlePromoSubmit(p.code)
                              }
                            >
                              <span className="promo-chip-code mono-num">
                                {isApplied && <Check size={12} />}
                                {p.code}
                              </span>
                              <span className="promo-chip-desc">{p.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="summary-totals">
                    <div className="summary-line">
                      <span>Subtotal</span>
                      <span className="mono-num">{formatMoney(breakdown.subtotal)}</span>
                    </div>
                    {breakdown.discount > 0 && (
                      <div className="summary-line is-discount">
                        <span>Discount ({breakdown.appliedPromo?.code})</span>
                        <span className="mono-num">
                          -{formatMoney(breakdown.discount)}
                        </span>
                      </div>
                    )}
                    <div className="summary-line">
                      <span>Shipping</span>
                      <span className="mono-num">
                        {breakdown.shippingCost === 0
                          ? 'Free'
                          : formatMoney(breakdown.shippingCost)}
                      </span>
                    </div>
                    <div className="summary-line">
                      <span>Estimated Tax (8%)</span>
                      <span className="mono-num">{formatMoney(breakdown.tax)}</span>
                    </div>
                    <div className="summary-line is-grand">
                      <span>Total</span>
                      <span className="mono-num">{formatMoney(breakdown.total)}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
