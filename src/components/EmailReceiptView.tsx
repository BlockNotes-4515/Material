import React from 'react';
import { Mail, Package, Truck, MapPin, CreditCard, Tag, ArrowRight } from 'lucide-react';
import {
  DELIVERY_OPTIONS,
  FINISH_META,
  OrderRecord,
  formatMoney,
} from '../types/order';
import { ShippingDispatchGraphic } from './ShippingDispatchGraphic';

interface EmailReceiptViewProps {
  order: OrderRecord;
  onTrackOrder: () => void;
}

export const EmailReceiptView: React.FC<EmailReceiptViewProps> = ({
  order,
  onTrackOrder,
}) => {
  const delivery =
    DELIVERY_OPTIONS.find((d) => d.id === order.deliveryId) ??
    DELIVERY_OPTIONS[0];

  return (
    <div className="email-client-shell">
      {/* Authentic Email Header Bar */}
      <div className="email-envelope-bar">
        <div className="email-envelope-row">
          <div className="email-sender-avatar" aria-hidden="true">
            <Mail size={16} />
          </div>
          <div className="email-envelope-meta">
            <div className="email-subject-line">
              Order {order.orderId} Confirmed — Packed &amp; Rolling Out
            </div>
            <div className="email-addresses-line">
              <span>From: Material Dispatch &lt;orders@materialflask.com&gt;</span>
              <span aria-hidden="true">·</span>
              <span>To: {order.user.email}</span>
              <span aria-hidden="true">·</span>
              <span>{order.createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rendered Email Body */}
      <div className="email-message-paper">
        <div className="email-brand-header">
          <div className="email-brand-lockup">
            <svg width="22" height="14" viewBox="0 0 28 18" fill="none" aria-hidden="true">
              <path
                d="M2 16L10.5 3L16 11.5L19.5 6.5L26 16H2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span>Material Flask</span>
          </div>
          <span className="email-order-id-text">
            Order {order.orderId} · {order.trackingNumber}
          </span>
        </div>

        <div className="email-hero-copy">
          <h3 className="email-headline">
            Your flask is packed and ready to ship, {order.user.fullName.split(' ')[0]}.
          </h3>
          <p className="email-lead">
            Thank you for ordering with Material. Our Boulder fulfillment team has
            verified your order and prepared your insulated parcel for{' '}
            <strong>{delivery.label}</strong>. Estimated arrival is{' '}
            <strong>{order.estimatedDelivery}</strong>.
          </p>
        </div>

        {/* Animated Box + Truck Dispatch Scene inside Email */}
        <div className="email-dispatch-wrap">
          <ShippingDispatchGraphic stageIndex={order.currentStageIndex} />
        </div>

        {/* Quick Shipment Highlights */}
        <div className="email-highlights-grid">
          <div className="email-highlight-item">
            <div className="email-highlight-icon">
              <Package size={16} />
            </div>
            <div>
              <div className="email-highlight-label">Packaging</div>
              <div className="email-highlight-val">Recycled Alpine Kraft Box</div>
            </div>
          </div>
          <div className="email-highlight-item">
            <div className="email-highlight-icon">
              <Truck size={16} />
            </div>
            <div>
              <div className="email-highlight-label">Carrier &amp; Speed</div>
              <div className="email-highlight-val">
                {delivery.label} · {delivery.eta}
              </div>
            </div>
          </div>
          <div className="email-highlight-item">
            <div className="email-highlight-icon">
              <CreditCard size={16} />
            </div>
            <div>
              <div className="email-highlight-label">Payment</div>
              <div className="email-highlight-val">{order.paymentLabel}</div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Information */}
        <div className="email-two-col">
          <div className="email-info-block">
            <div className="email-block-title">
              <MapPin size={14} />
              <span>Recipient &amp; Shipping Address</span>
            </div>
            <div className="email-address-lines">
              <strong>{order.user.fullName}</strong>
              <span>
                {order.user.address}
                {order.user.apartment ? `, ${order.user.apartment}` : ''}
              </span>
              <span>
                {order.user.city}, {order.user.state} {order.user.postalCode}
              </span>
              <span>{order.user.country}</span>
              <span className="email-contact-sub">
                {order.user.email} · {order.user.phone}
              </span>
            </div>
          </div>

          <div className="email-info-block">
            <div className="email-block-title">
              <Tag size={14} />
              <span>Order Summary &amp; Notes</span>
            </div>
            <div className="email-address-lines">
              <span>
                Tracking ID: <strong className="mono-num">{order.trackingNumber}</strong>
              </span>
              <span>
                Promo Applied:{' '}
                <strong>{order.promoCode ? order.promoCode : 'None'}</strong>
              </span>
              <span>
                Items Ordered:{' '}
                <strong>
                  {order.items.reduce((s, it) => s + it.qty, 0)} flask(s)
                </strong>
              </span>
              {order.user.giftNote && (
                <span className="email-gift-note">
                  Note: &ldquo;{order.user.giftNote}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Products */}
        <div className="email-items-table">
          <div className="email-items-head">
            <span>Item</span>
            <span>Qty</span>
            <span>Amount</span>
          </div>
          {order.items.map((item) => (
            <div
              key={`${item.finish}-${item.size}`}
              className="email-item-row"
            >
              <div className="email-item-product">
                <span
                  className="email-item-dot"
                  style={{ background: FINISH_META[item.finish].dot }}
                />
                <div>
                  <div className="email-item-title">Material Flask</div>
                  <div className="email-item-sub">
                    {FINISH_META[item.finish].name} · {item.size}
                  </div>
                </div>
              </div>
              <span className="mono-num">×{item.qty}</span>
              <span className="mono-num">
                {formatMoney(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="email-totals-block">
          <div className="email-total-line">
            <span>Subtotal</span>
            <span className="mono-num">{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="email-total-line is-discount">
              <span>Promo Discount ({order.promoCode})</span>
              <span className="mono-num">-{formatMoney(order.discount)}</span>
            </div>
          )}
          <div className="email-total-line">
            <span>Shipping ({delivery.label})</span>
            <span className="mono-num">
              {order.shippingCost === 0 ? 'Free' : formatMoney(order.shippingCost)}
            </span>
          </div>
          <div className="email-total-line">
            <span>Estimated Tax (8%)</span>
            <span className="mono-num">{formatMoney(order.tax)}</span>
          </div>
          <div className="email-total-line is-grand">
            <span>
              {order.paymentMethod === 'cod' ? 'Total Due on Delivery' : 'Total Paid'}
            </span>
            <span className="mono-num">{formatMoney(order.total)}</span>
          </div>
        </div>

        <div className="email-cta-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onTrackOrder}
          >
            Track Live Shipment
            <ArrowRight size={16} />
          </button>
          <span className="email-footer-help">
            Questions? Reply directly to orders@materialflask.com
          </span>
        </div>
      </div>
    </div>
  );
};
