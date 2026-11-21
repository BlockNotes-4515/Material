import React from 'react';
import {
  Ban,
  Check,
  Download,
  FastForward,
  Mail,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  User,
} from 'lucide-react';
import {
  DELIVERY_OPTIONS,
  FINISH_META,
  ORDER_STAGES,
  OrderRecord,
  formatMoney,
} from '../types/order';
import { ShippingDispatchGraphic } from './ShippingDispatchGraphic';
import {
  ApplePayLogo,
  CodBadgeLogo,
  GooglePayLogo,
  PayPalLogo,
  PaytmLogo,
  PhonePeLogo,
  StripeLogo,
} from './PaymentLogos';

interface OrderTrackingTimelineProps {
  order: OrderRecord;
  totalUserOrders: number;
  onAdvanceStage: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (orderId: string) => void;
  onDownloadInvoice: () => void;
  onOpenEmail: () => void;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  order,
  totalUserOrders,
  onAdvanceStage,
  onCancelOrder,
  onRequestReturn,
  onDownloadInvoice,
  onOpenEmail,
}) => {
  const delivery =
    DELIVERY_OPTIONS.find((d) => d.id === order.deliveryId) ??
    DELIVERY_OPTIONS[0];
  const isDelivered = order.currentStageIndex >= ORDER_STAGES.length - 1;
  const canCancel = !order.cancelled && order.currentStageIndex < 2;
  const canReturn = !order.cancelled && isDelivered && !order.returnRequested;

  const renderPaymentLogo = () => {
    switch (order.paymentMethod) {
      case 'stripe':
        return <StripeLogo />;
      case 'paypal':
        return <PayPalLogo />;
      case 'gpay':
        return <GooglePayLogo />;
      case 'phonepe':
        return <PhonePeLogo />;
      case 'paytm':
        return <PaytmLogo />;
      case 'applepay':
        return <ApplePayLogo />;
      case 'cod':
      default:
        return <CodBadgeLogo />;
    }
  };

  return (
    <div className="tracker-layout">
      {/* Current User & Active Order Header */}
      <div className="tracker-top-grid">
        <div className="tracker-user-card">
          <div className="tracker-card-kicker">
            <User size={14} />
            <span>Current User</span>
          </div>
          <div className="tracker-user-name">{order.user.fullName}</div>
          <div className="tracker-user-meta">
            <span>{order.user.email}</span>
            <span aria-hidden="true">·</span>
            <span>{order.user.phone}</span>
          </div>
          <div className="tracker-user-address">
            <MapPin size={14} />
            <span>
              {order.user.address}
              {order.user.apartment ? `, ${order.user.apartment}` : ''},{' '}
              {order.user.city}, {order.user.state} {order.user.postalCode}
            </span>
          </div>
          <div className="tracker-user-stats">
            <span>
              Total Orders: <strong className="mono-num">{totalUserOrders}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tracker-payment-inline">
              {renderPaymentLogo()}
              <span>{order.paymentLabel}</span>
            </span>
          </div>
        </div>

        <div className="tracker-shipment-card">
          <div className="tracker-card-kicker">
            <Truck size={14} />
            <span>
              {order.cancelled
                ? 'Order Cancelled'
                : order.returnRequested
                ? 'Return Initiated'
                : 'Active Shipment'}
            </span>
          </div>
          <div className="tracker-order-row">
            <span className="tracker-order-id mono-num">{order.orderId}</span>
            <span className="tracker-eta">
              {order.cancelled
                ? 'Refund Initiated'
                : order.returnRequested
                ? 'Pickup Scheduled'
                : `ETA ${order.estimatedDelivery}`}
            </span>
          </div>
          <div className="tracker-tracking-meta">
            <span>
              Tracking: <strong className="mono-num">{order.trackingNumber}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>{delivery.label}</span>
          </div>

          <div className="tracker-actions-row">
            {!order.cancelled && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isDelivered}
                onClick={() => onAdvanceStage(order.orderId)}
              >
                <FastForward size={15} />
                {isDelivered ? 'Delivered' : 'Simulate Next Stage'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onOpenEmail}
            >
              <Mail size={15} />
              View Email
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onDownloadInvoice}
            >
              <Download size={15} />
              Invoice
            </button>
            {canCancel && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onCancelOrder(order.orderId)}
              >
                <Ban size={15} />
                Cancel
              </button>
            )}
            {canReturn && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRequestReturn(order.orderId)}
              >
                <RotateCcw size={15} />
                Request Return
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Animated Truck & Box Scene */}
      {!order.cancelled && (
        <ShippingDispatchGraphic stageIndex={order.currentStageIndex} />
      )}

      {/* 5-Stage Shipment Timeline + Order Contents */}
      <div className="tracker-lower-grid">
        <div className="tracker-steps-panel">
          <h4 className="tracker-panel-title">Shipment Progress</h4>
          <ol className="tracker-timeline">
            {ORDER_STAGES.map((stage, idx) => {
              const completed =
                !order.cancelled && idx <= order.currentStageIndex;
              const isCurrent =
                !order.cancelled && idx === order.currentStageIndex;
              const loggedEvent = order.events.find((e) => e.stage === stage.key);
              return (
                <li
                  key={stage.key}
                  className={`timeline-step${completed ? ' is-done' : ''}${
                    isCurrent ? ' is-current' : ''
                  }`}
                >
                  <div className="timeline-node" aria-hidden="true">
                    {completed ? <Check size={14} /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-head">
                      <span className="timeline-label">{stage.label}</span>
                      <span className="timeline-time mono-num">
                        {loggedEvent ? loggedEvent.timestamp : 'Pending'}
                      </span>
                    </div>
                    <p className="timeline-detail">
                      {loggedEvent ? loggedEvent.detail : stage.defaultDetail}
                    </p>
                    {loggedEvent && (
                      <span className="timeline-loc">{loggedEvent.location}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="tracker-items-panel">
          <h4 className="tracker-panel-title">
            <Package size={16} />
            <span>Package Contents</span>
          </h4>
          <div className="tracker-items-list">
            {order.items.map((item) => (
              <div
                key={`${item.finish}-${item.size}`}
                className="tracker-item-row"
              >
                <div className="tracker-item-left">
                  <span
                    className="email-item-dot"
                    style={{ background: FINISH_META[item.finish].dot }}
                  />
                  <div>
                    <div className="tracker-item-name">
                      Material Flask · {FINISH_META[item.finish].name}
                    </div>
                    <div className="tracker-item-sub">
                      {item.size} × {item.qty}
                    </div>
                  </div>
                </div>
                <span className="mono-num">
                  {formatMoney(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="tracker-summary-totals">
            <div className="tracker-sum-line">
              <span>Subtotal</span>
              <span className="mono-num">{formatMoney(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="tracker-sum-line is-discount">
                <span>Promo ({order.promoCode})</span>
                <span className="mono-num">-{formatMoney(order.discount)}</span>
              </div>
            )}
            <div className="tracker-sum-line">
              <span>Shipping</span>
              <span className="mono-num">
                {order.shippingCost === 0
                  ? 'Free'
                  : formatMoney(order.shippingCost)}
              </span>
            </div>
            <div className="tracker-sum-line">
              <span>Tax</span>
              <span className="mono-num">{formatMoney(order.tax)}</span>
            </div>
            <div className="tracker-sum-line is-total">
              <span>Total</span>
              <span className="mono-num">{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
