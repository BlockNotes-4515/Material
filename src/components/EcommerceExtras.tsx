import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Heart,
  Ruler,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  FAQ_ITEMS,
  FINISH_META,
  FinishId,
  ProductReview,
  SIZE_OPTIONS,
  SIZE_SPECS,
  SizeLabel,
  WishlistItem,
  formatMoney,
} from '../types/order';

interface WishlistModalProps {
  isOpen: boolean;
  items: WishlistItem[];
  onClose: () => void;
  onMoveToBag: (item: WishlistItem) => void;
  onRemove: (finish: FinishId, size: SizeLabel) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  items,
  onClose,
  onMoveToBag,
  onRemove,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Saved Wishlist"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="compact-modal-card" data-lenis-prevent>
        <div className="drawer-header">
          <h2 className="drawer-title">Saved Wishlist ({items.length})</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close wishlist"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="compact-modal-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <Heart size={24} />
              <p>No saved configurations yet. Tap the heart on any flask to save it.</p>
            </div>
          ) : (
            <div className="wishlist-list">
              {items.map((item) => (
                <div key={`${item.finish}-${item.size}`} className="bag-item">
                  <img
                    src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-order-cutout.webp"
                    alt={`Material Flask ${FINISH_META[item.finish].name}`}
                    className="bag-item-thumb"
                    data-finish={item.finish}
                  />
                  <div className="bag-item-info">
                    <div className="bag-item-name">Material Flask</div>
                    <div className="bag-item-meta">
                      {FINISH_META[item.finish].name} · {item.size} ·{' '}
                      <span className="mono-num">{formatMoney(item.price)}</span>
                    </div>
                    <div className="wishlist-item-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onMoveToBag(item)}
                      >
                        <ShoppingBag size={14} />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Remove from wishlist"
                        onClick={() => onRemove(item.finish, item.size)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SizeGuideModalProps {
  isOpen: boolean;
  activeSize: SizeLabel;
  onSelectSize: (size: SizeLabel, price: number) => void;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  activeSize,
  onSelectSize,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Size and Capacity Guide"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="compact-modal-card is-wide" data-lenis-prevent>
        <div className="drawer-header">
          <div className="checkout-brand">
            <Ruler size={18} />
            <span>Size &amp; Capacity Guide</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close size guide"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="compact-modal-body">
          <div className="size-guide-table">
            {SIZE_OPTIONS.map((opt) => {
              const specs = SIZE_SPECS[opt.size];
              const isSelected = activeSize === opt.size;
              return (
                <div
                  key={opt.size}
                  className={`size-guide-card${isSelected ? ' is-active' : ''}`}
                >
                  <div className="size-guide-head">
                    <div>
                      <div className="size-guide-title">{opt.size}</div>
                      <div className="size-guide-price mono-num">
                        {formatMoney(opt.price)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm${isSelected ? ' btn-primary' : ' btn-ghost'}`}
                      onClick={() => {
                        onSelectSize(opt.size, opt.price);
                        onClose();
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check size={14} /> Selected
                        </>
                      ) : (
                        'Select Size'
                      )}
                    </button>
                  </div>

                  <div className="size-guide-specs">
                    <div className="spec-row">
                      <span className="spec-key">Height</span>
                      <span className="spec-val mono-num">{specs.height}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-key">Diameter</span>
                      <span className="spec-val mono-num">{specs.diameter}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-key">Empty Weight</span>
                      <span className="spec-val mono-num">{specs.weight}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-key">Fit</span>
                      <span className="spec-val">{specs.cupholder}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-key">Best For</span>
                      <span className="spec-val">{specs.bestFor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProductReviewsAndFaqProps {
  reviews: ProductReview[];
  defaultAuthor: string;
  activeFinish: FinishId;
  activeSize: SizeLabel;
  onAddReview: (review: ProductReview) => void;
}

export const ProductReviewsAndFaq: React.FC<ProductReviewsAndFaqProps> = ({
  reviews,
  defaultAuthor,
  activeFinish,
  activeSize,
  onAddReview,
}) => {
  const [filterFinish, setFilterFinish] = useState<'all' | FinishId>('all');
  const [showWriteForm, setShowWriteForm] = useState<boolean>(false);
  const [author, setAuthor] = useState<string>(defaultAuthor);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const filteredReviews =
    filterFinish === 'all'
      ? reviews
      : reviews.filter((r) => r.finish === filterFinish);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : '4.9';

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onAddReview({
      id: `rev-${Date.now()}`,
      author: author.trim() || 'Verified Customer',
      finish: activeFinish,
      size: activeSize,
      rating,
      title: title.trim(),
      body: body.trim(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      verified: true,
    });
    setTitle('');
    setBody('');
    setShowWriteForm(false);
  };

  return (
    <section id="reviews" className="reviews-faq-section">
      <div className="container">
        {/* Verified Reviews */}
        <div className="reviews-header-row">
          <div>
            <h2 className="section-title">Field tested.</h2>
            <div className="reviews-score-line">
              <div className="reviews-stars" aria-label={`${avgRating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    fill={n <= Math.round(Number(avgRating)) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="mono-num">
                <strong>{avgRating}</strong> / 5.0
              </span>
              <span aria-hidden="true">·</span>
              <span>{reviews.length + 314} verified reviews</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowWriteForm((prev) => !prev)}
          >
            {showWriteForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {/* Finish Filter Tabs */}
        <div className="reviews-filter-row" role="tablist" aria-label="Filter reviews by finish">
          <button
            type="button"
            role="tab"
            aria-selected={filterFinish === 'all'}
            className={`pill-option${filterFinish === 'all' ? ' is-active' : ''}`}
            onClick={() => setFilterFinish('all')}
          >
            All Finishes
          </button>
          {(Object.keys(FINISH_META) as FinishId[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filterFinish === key}
              className={`pill-option${filterFinish === key ? ' is-active' : ''}`}
              onClick={() => setFilterFinish(key)}
            >
              <span className="dot" style={{ background: FINISH_META[key].dot }} />
              {FINISH_META[key].name}
            </button>
          ))}
        </div>

        {showWriteForm && (
          <form onSubmit={handleReviewSubmit} className="write-review-card">
            <div className="form-grid-2">
              <div className="field-group">
                <label className="field-label" htmlFor="rev-author">
                  Your Name
                </label>
                <input
                  id="rev-author"
                  type="text"
                  className="field-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <span className="field-label">Rating</span>
                <div className="rating-picker">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      className={`rating-star-btn${rating >= starVal ? ' is-active' : ''}`}
                      aria-label={`Rate ${starVal} stars`}
                      onClick={() => setRating(starVal)}
                    >
                      <Star
                        size={18}
                        fill={rating >= starVal ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="rev-title">
                Headline
              </label>
              <input
                id="rev-title"
                type="text"
                className="field-input"
                placeholder="Summarize your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="rev-body">
                Review ({FINISH_META[activeFinish].name} · {activeSize})
              </label>
              <textarea
                id="rev-body"
                rows={3}
                className="field-input field-textarea"
                placeholder="How does it perform on the trail or commute?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>

            <div>
              <button type="submit" className="btn btn-primary btn-sm">
                Publish Review
              </button>
            </div>
          </form>
        )}

        <div className="reviews-grid">
          {filteredReviews.length === 0 ? (
            <div className="review-card">
              <p className="review-body">
                No reviews for {FINISH_META[filterFinish as FinishId]?.name} yet. Be the
                first to share yours!
              </p>
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <article key={rev.id} className="review-card">
                <div className="review-card-top">
                  <div className="reviews-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= rev.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="review-date">{rev.date}</span>
                </div>
                <h3 className="review-title">{rev.title}</h3>
                <p className="review-body">{rev.body}</p>
                <div className="review-meta-line">
                  <strong>{rev.author}</strong>
                  <span aria-hidden="true">·</span>
                  <span>
                    {FINISH_META[rev.finish].name} ({rev.size})
                  </span>
                  {rev.verified && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="review-verified-txt">Verified Buyer</span>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {/* FAQ & Shipping Policy */}
        <div className="faq-block">
          <h3 className="faq-heading">Shipping, Care &amp; Warranty</h3>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={item.q} className={`faq-item${isOpen ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={17} className="faq-chevron" />
                  </button>
                  {isOpen && <p className="faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
