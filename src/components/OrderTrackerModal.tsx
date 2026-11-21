import React, { useEffect, useState } from 'react';
import {
  Mail,
  Maximize2,
  Minimize2,
  Package,
  Search,
  Truck,
  User,
  X,
} from 'lucide-react';
import { OrderRecord, UserDetails } from '../types/order';
import { EmailReceiptView } from './EmailReceiptView';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { downloadOrderInvoice } from './CheckoutModal';

interface OrderTrackerModalProps {
  isOpen: boolean;
  orders: OrderRecord[];
  initialOrderId: string | null;
  initialView: 'track' | 'email';
  currentUser: UserDetails;
  onClose: () => void;
  onAdvanceStage: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onRequestReturn: (orderId: string) => void;
  onStartOrder: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  orders,
  initialOrderId,
  initialView,
  currentUser,
  onClose,
  onAdvanceStage,
  onCancelOrder,
  onRequestReturn,
  onStartOrder,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrderId ?? orders[0]?.orderId ?? null
  );
  const [activeView, setActiveView] = useState<'track' | 'email'>(initialView);
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsMaximized(true);
      setActiveView(initialView);
      setSelectedOrderId(initialOrderId ?? orders[0]?.orderId ?? null);
      setLookupError(null);
    }
  }, [isOpen, initialOrderId, initialView, orders]);

  if (!isOpen) return null;

  const activeOrder =
    orders.find((o) => o.orderId === selectedOrderId) ?? orders[0] ?? null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim().toUpperCase();
    if (!q) return;
    const match = orders.find(
      (o) =>
        o.orderId.toUpperCase() === q ||
        o.trackingNumber.toUpperCase() === q
    );
    if (!match) {
      setLookupError(`No order found matching "${q}".`);
      return;
    }
    setLookupError(null);
    setSelectedOrderId(match.orderId);
  };

  return (
    <div
      className="checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Order Tracking and Inbox"
      data-lenis-prevent
    >
      <div className={`checkout-window${isMaximized ? ' is-maximized' : ''}`}>
        <header className="checkout-topbar">
          <div className="checkout-topbar-left">
            <div className="checkout-brand">
              <Truck size={18} />
              <span>Order Tracker &amp; Inbox</span>
            </div>

            {activeOrder && (
              <div className="confirmed-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'track'}
                  className={`seg-btn${activeView === 'track' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('track')}
                >
                  <Truck size={14} />
                  <span>Track Order</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === 'email'}
                  className={`seg-btn${activeView === 'email' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('email')}
                >
                  <Mail size={14} />
                  <span>Email Message</span>
                </button>
              </div>
            )}
          </div>

          <div className="checkout-topbar-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={isMaximized ? 'Restore window size' : 'Maximize window'}
              onClick={() => setIsMaximized((prev) => !prev)}
            >
              {isMaximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close order tracker"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="checkout-scroll-body" data-lenis-prevent>
          <div className="tracker-modal-container">
            {orders.length === 0 ? (
              <div className="tracker-empty-state">
                <div className="tracker-empty-icon" aria-hidden="true">
                  <Package size={28} />
                </div>
                <div className="tracker-empty-user">
                  <User size={14} />
                  <span>
                    Signed in as <strong>{currentUser.fullName}</strong> ({currentUser.email})
                  </span>
                </div>
                <h2 className="tracker-empty-title">No active orders yet.</h2>
                <p className="tracker-empty-sub">
                  Configure your Material Flask, apply a promo code, and place an order
                  to receive your animated shipping email and live truck tracking.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onStartOrder}
                >
                  Configure &amp; Order Flask
                </button>
              </div>
            ) : (
              <>
                <div className="tracker-toolbar">
                  <div className="tracker-order-pills">
                    {orders.map((ord) => (
                      <button
                        key={ord.orderId}
                        type="button"
                        className={`pill-option${
                          activeOrder?.orderId === ord.orderId ? ' is-active' : ''
                        }`}
                        onClick={() => {
                          setSelectedOrderId(ord.orderId);
                          setLookupError(null);
                        }}
                      >
                        <span className="mono-num">{ord.orderId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.cancelled ? 'Cancelled' : ord.createdAt}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleLookup} className="tracker-lookup-form">
                    <input
                      type="text"
                      className="field-input mono-num"
                      placeholder="Order or tracking ID"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      <Search size={14} />
                      <span>Find</span>
                    </button>
                  </form>
                </div>

                {lookupError && (
                  <div className="payment-error-box" role="alert">
                    {lookupError}
                  </div>
                )}

                {activeOrder &&
                  (activeView === 'email' ? (
                    <EmailReceiptView
                      order={activeOrder}
                      onTrackOrder={() => setActiveView('track')}
                    />
                  ) : (
                    <OrderTrackingTimeline
                      order={activeOrder}
                      totalUserOrders={orders.length}
                      onAdvanceStage={onAdvanceStage}
                      onCancelOrder={onCancelOrder}
                      onRequestReturn={onRequestReturn}
                      onDownloadInvoice={() => downloadOrderInvoice(activeOrder)}
                      onOpenEmail={() => setActiveView('email')}
                    />
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
