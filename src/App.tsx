import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Heart, Mail, Maximize2, Ruler, Tag, Truck, X } from 'lucide-react';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';
import {
  BagItem,
  FINISH_META,
  FinishId,
  INITIAL_REVIEWS,
  ORDER_STAGES,
  OrderRecord,
  PROMO_CODES,
  ProductReview,
  SIZE_OPTIONS,
  SizeLabel,
  UserDetails,
  WishlistItem,
  calculatePriceBreakdown,
  formatMoney,
  formatShortTimestamp,
  validatePromoCode,
} from './types/order';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import {
  ProductReviewsAndFaq,
  SizeGuideModal,
  WishlistModal,
} from './components/EcommerceExtras';

gsap.registerPlugin(ScrollTrigger);

const STORAGE_ORDERS_KEY = 'material_flask_orders_v1';
const STORAGE_USER_KEY = 'material_flask_user_v1';
const STORAGE_WISHLIST_KEY = 'material_flask_wishlist_v1';
const STORAGE_REVIEWS_KEY = 'material_flask_reviews_v1';

const DEFAULT_USER: UserDetails = {
  fullName: 'Dhruv Dhayal',
  email: 'dhayaldhruv271@gmail.com',
  phone: '+1 (303) 555-0194',
  address: '1420 Alpine Ridge Blvd',
  apartment: 'Suite 3A',
  city: 'Boulder',
  state: 'CO',
  postalCode: '80302',
  country: 'United States',
  giftNote: '',
};

const SHOWCASE_STAGES = [
  {
    src: 'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-studio.webp',
    alt: 'Material Flask standing on honed dark basalt slate in an architectural studio',
    title: 'Alpine Sage Matte',
    sub: 'Powder-coated 18/8 stainless steel',
  },
  {
    src: 'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-river.webp',
    alt: 'Material Flask on a sunlit cedar picnic table beside a clear mountain river',
    title: 'Made for the Outside',
    sub: 'Zero condensation from morning trails to sunny riverbanks',
  },
  {
    src: 'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-trail.webp',
    alt: 'Material Flask resting on a sunlit granite boulder overlooking golden alpine meadows',
    title: 'Machined Steel Collar',
    sub: 'Leakproof chug lid built to take a knock',
  },
  {
    src: 'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-lake.webp',
    alt: 'Material Flask on a stone lakeside dock at dusk overlooking calm alpine water',
    title: 'All-Day Carry',
    sub: 'Built to go from sunny ridge hikes to quiet evening camp',
  },
];

export default function App() {
  // Always open in light mode regardless of browser dark-mode preference
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [finish, setFinish] = useState<FinishId>('sage');
  const [size, setSize] = useState<SizeLabel>('950 ml');
  const [price, setPrice] = useState<number>(48);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [captionBlur, setCaptionBlur] = useState<boolean>(false);
  const [splitPct, setSplitPct] = useState<number>(50);
  const [splitAnimate, setSplitAnimate] = useState<boolean>(false);
  const [bag, setBag] = useState<BagItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [drawerPromoInput, setDrawerPromoInput] = useState<string>('');
  const [drawerPromoFeedback, setDrawerPromoFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [userDetails, setUserDetails] = useState<UserDetails>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_USER_KEY);
      if (saved) return { ...DEFAULT_USER, ...JSON.parse(saved) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_USER;
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_ORDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [trackerOpen, setTrackerOpen] = useState<boolean>(false);
  const [trackerInitialOrderId, setTrackerInitialOrderId] = useState<string | null>(null);
  const [trackerInitialView, setTrackerInitialView] = useState<'track' | 'email'>('track');
  const [emailToastOrder, setEmailToastOrder] = useState<OrderRecord | null>(null);

  const [configQty, setConfigQty] = useState<number>(1);
  const [wishlistOpen, setWishlistOpen] = useState<boolean>(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterDone, setNewsletterDone] = useState<boolean>(false);

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_WISHLIST_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_REVIEWS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return INITIAL_REVIEWS;
  });

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const tiltWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const compWrapRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const stageIdxRef = useRef<number>(0);
  const stageTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lenisRef = useRef<InstanceType<typeof Lenis> | null>(null);
  const selectedConfigRef = useRef<{
    finish: FinishId;
    size: SizeLabel;
    price: number;
  }>({ finish: 'sage', size: '950 ml', price: 48 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore storage errors
    }
  }, [orders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userDetails));
    } catch {
      // ignore storage errors
    }
  }, [userDetails]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore storage errors
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
    } catch {
      // ignore storage errors
    }
  }, [reviews]);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let velX = 0;
    let velY = 0;
    let tiltTicker: (() => void) | null = null;

    const heroStage = heroStageRef.current;
    const onHeroMove = (e: PointerEvent) => {
      if (!heroStage) return;
      const rect = heroStage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 14;
      targetRotX = -ny * 10;
    };
    const onHeroLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    if (heroStage && tiltWrapRef.current && !prefersReduced) {
      heroStage.addEventListener('pointermove', onHeroMove);
      heroStage.addEventListener('pointerleave', onHeroLeave);
      tiltTicker = () => {
        const ax = (targetRotX - curRotX) * 0.08;
        const ay = (targetRotY - curRotY) * 0.08;
        velX = (velX + ax) * 0.82;
        velY = (velY + ay) * 0.82;
        curRotX += velX;
        curRotY += velY;
        if (tiltWrapRef.current) {
          tiltWrapRef.current.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
        }
        if (shadowRef.current) {
          shadowRef.current.style.transform = `translateX(${(-curRotY * 1.4).toFixed(1)}px) scale(${1 - Math.abs(curRotX) * 0.01})`;
        }
      };
      gsap.ticker.add(tiltTicker);
    }

    const gsapCtx = gsap.context(() => {
      if (prefersReduced) return;

      const frames = frameRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      if (showcaseRef.current && frames.length === 4) {
        // Explicit dwell + wipe cadence: caption advances only once incoming image is >= 90% revealed
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top top',
            end: '+=280%',
            pin: true,
            scrub: 0.65,
            onUpdate: (self: { progress: number }) => {
              const t = self.progress * 3.5;
              let nextIdx = 0;
              if (t >= 3.07) nextIdx = 3;
              else if (t >= 2.02) nextIdx = 2;
              else if (t >= 0.97) nextIdx = 1;

              if (nextIdx !== stageIdxRef.current) {
                stageIdxRef.current = nextIdx;
                setCaptionBlur(true);
                if (stageTimerRef.current !== null) {
                  window.clearTimeout(stageTimerRef.current);
                }
                stageTimerRef.current = window.setTimeout(() => {
                  stageTimerRef.current = null;
                  setActiveStage(nextIdx);
                  setCaptionBlur(false);
                }, 100);
              }
            },
          },
        });

        const wipeStarts = [0.25, 1.3, 2.35];
        frames.forEach((frame, i) => {
          if (i === 0) return;
          tl.fromTo(
            frame,
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
            wipeStarts[i - 1]
          );
        });
        tl.set({}, {}, 3.5);
      }

      if (bentoGridRef.current) {
        gsap.from('.reveal-tile', {
          y: 28,
          scale: 0.96,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: bentoGridRef.current,
            start: 'top 82%',
            once: true,
          },
        });
      }
    });

    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      cleanupHeroGl();
      cleanupSpecsGl();
      gsapCtx.revert();
      if (tiltTicker) gsap.ticker.remove(tiltTicker);
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenisRef.current = null;
      lenis?.destroy();
      heroStage?.removeEventListener('pointermove', onHeroMove);
      heroStage?.removeEventListener('pointerleave', onHeroLeave);
    };
  }, []);

  useEffect(() => {
    const anyFullscreenModal =
      checkoutOpen || trackerOpen || wishlistOpen || sizeGuideOpen;
    if (anyFullscreenModal) {
      document.body.style.overflow = 'hidden';
      lenisRef.current?.stop();
    } else {
      document.body.style.overflow = '';
      lenisRef.current?.start();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [checkoutOpen, trackerOpen, wishlistOpen, sizeGuideOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (checkoutOpen) {
          setCheckoutOpen(false);
          setCompletedOrder(null);
        } else if (trackerOpen) {
          setTrackerOpen(false);
        } else if (wishlistOpen) {
          setWishlistOpen(false);
        } else if (sizeGuideOpen) {
          setSizeGuideOpen(false);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, checkoutOpen, trackerOpen, wishlistOpen, sizeGuideOpen]);

  const selectStage = (idx: number) => {
    stageIdxRef.current = idx;
    setCaptionBlur(true);
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current);
    }
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      setActiveStage(idx);
      setCaptionBlur(false);
    }, 110);
    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      frame.style.clipPath =
        i <= idx ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)';
    });
  };

  const updateSplit = (pct: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setSplitAnimate(animate);
    setSplitPct(clamped);
  };

  const handleCompPointerDown = (e: {
    currentTarget: HTMLDivElement;
    pointerId: number;
    clientX: number;
  }) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerMove = (e: {
    currentTarget: HTMLDivElement;
    clientX: number;
  }) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerUp = () => {
    isDraggingRef.current = false;
  };

  const selectFinish = (nextFinish: FinishId) => {
    selectedConfigRef.current.finish = nextFinish;
    setFinish(nextFinish);
  };

  const selectSize = (nextSize: SizeLabel, nextPrice: number) => {
    selectedConfigRef.current.size = nextSize;
    selectedConfigRef.current.price = nextPrice;
    setSize(nextSize);
    setPrice(nextPrice);
  };

  const addToBag = (openDrawer = true, qtyOverride?: number) => {
    const activeCfg = selectedConfigRef.current;
    const qtyToAdd = qtyOverride ?? configQty;
    setBag((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.finish === activeCfg.finish && item.size === activeCfg.size
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qtyToAdd };
        return next;
      }
      return [
        ...prev,
        {
          finish: activeCfg.finish,
          size: activeCfg.size,
          price: activeCfg.price,
          qty: qtyToAdd,
        },
      ];
    });
    if (openDrawer) {
      setDrawerOpen(true);
    }
  };

  const handleDirectOrder = () => {
    const activeCfg = selectedConfigRef.current;
    setBag((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          finish: activeCfg.finish,
          size: activeCfg.size,
          price: activeCfg.price,
          qty: configQty,
        },
      ];
    });
    setDrawerOpen(false);
    setCompletedOrder(null);
    setCheckoutOpen(true);
  };

  const isWishlisted = wishlist.some(
    (w) => w.finish === finish && w.size === size
  );

  const toggleWishlist = () => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.finish === finish && w.size === size);
      if (exists) {
        return prev.filter((w) => !(w.finish === finish && w.size === size));
      }
      return [...prev, { finish, size, price }];
    });
  };

  const updateBagQty = (idx: number, delta: number) => {
    setBag((prev) => {
      const next = [...prev];
      const updatedQty = next[idx].qty + delta;
      if (updatedQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], qty: updatedQty };
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (bag.length === 0) return;
    setDrawerOpen(false);
    setCompletedOrder(null);
    setCheckoutOpen(true);
  };

  const handleApplyDrawerPromo = (rawCode?: string) => {
    const target = (rawCode ?? drawerPromoInput).trim().toUpperCase();
    const res = validatePromoCode(target, drawerBreakdown.subtotal);
    if (!res.valid) {
      setDrawerPromoFeedback({ type: 'err', text: res.error });
      return;
    }
    setPromoCode(res.promo.code);
    setDrawerPromoInput(res.promo.code);
    setDrawerPromoFeedback({
      type: 'ok',
      text: `${res.promo.code} applied (${res.promo.title})`,
    });
  };

  const handleOrderComplete = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCompletedOrder(newOrder);
    setBag([]);
    setPromoCode(null);
    setDrawerPromoInput('');
    setDrawerPromoFeedback(null);
    setEmailToastOrder(newOrder);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setEmailToastOrder(null);
      toastTimerRef.current = null;
    }, 10000);
  };

  const handleAdvanceOrderStage = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const nextIdx = Math.min(
          ORDER_STAGES.length - 1,
          ord.currentStageIndex + 1
        );
        if (nextIdx === ord.currentStageIndex) return ord;
        const stageMeta = ORDER_STAGES[nextIdx];
        const nextOrder: OrderRecord = {
          ...ord,
          currentStageIndex: nextIdx,
          events: [
            ...ord.events,
            {
              stage: stageMeta.key,
              title: stageMeta.label,
              detail: stageMeta.defaultDetail,
              location: stageMeta.defaultLocation,
              timestamp: formatShortTimestamp(),
            },
          ],
        };
        if (completedOrder?.orderId === orderId) {
          setCompletedOrder(nextOrder);
        }
        return nextOrder;
      })
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const nextOrder: OrderRecord = { ...ord, cancelled: true };
        if (completedOrder?.orderId === orderId) {
          setCompletedOrder(nextOrder);
        }
        return nextOrder;
      })
    );
  };

  const handleRequestReturn = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const nextOrder: OrderRecord = { ...ord, returnRequested: true };
        if (completedOrder?.orderId === orderId) {
          setCompletedOrder(nextOrder);
        }
        return nextOrder;
      })
    );
  };

  const openTracker = (orderId?: string | null, view: 'track' | 'email' = 'track') => {
    setTrackerInitialOrderId(orderId ?? orders[0]?.orderId ?? null);
    setTrackerInitialView(view);
    setTrackerOpen(true);
  };

  const totalQty = bag.reduce((sum, item) => sum + item.qty, 0);
  const drawerBreakdown = calculatePriceBreakdown(bag, promoCode, 'standard');
  const drawerFreeShipRemaining = Math.max(0, 75 - drawerBreakdown.subtotal);
  const activeScale =
    SIZE_OPTIONS.find((s) => s.size === size)?.scale ?? 1.0;

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />

      <header className="site-header" id="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand-lockup" aria-label="Material Flask Home">
            <svg
              className="brand-mark"
              width="24"
              height="15"
              viewBox="0 0 28 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 16L10.5 3L16 11.5L19.5 6.5L26 16H2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="brand-wordmark">Material</span>
          </a>

          <nav className="header-nav" aria-label="Primary">
            <a href="#showcase" className="nav-link">
              Showcase
            </a>
            <a href="#craft" className="nav-link">
              Specs
            </a>
            <a href="#reviews" className="nav-link">
              Reviews
            </a>
            <a href="#order" className="nav-link">
              Order
            </a>
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={() => openTracker(orders[0]?.orderId ?? null, 'track')}
            >
              Track Order{orders.length > 0 ? ` (${orders.length})` : ''}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Open saved wishlist"
              title="Saved Wishlist"
              onClick={() => setWishlistOpen(true)}
            >
              <Heart size={18} fill={wishlist.length > 0 ? 'currentColor' : 'none'} />
              {wishlist.length > 0 && (
                <span className="bag-count">{wishlist.length}</span>
              )}
            </button>
            <button
              type="button"
              className="icon-btn theme-toggle"
              id="theme-toggle"
              aria-label="Toggle color theme"
              title="Switch light or dark theme"
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : 'light';
                setTheme(nextTheme);
                selectFinish(nextTheme === 'dark' ? 'basalt' : 'sage');
              }}
            >
              <svg
                id="theme-icon-sun"
                width="19"
                height="19"
                viewBox="0 0 256 256"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="128" cy="128" r="56" stroke="currentColor" strokeWidth="18" />
                <line x1="128" y1="24" x2="128" y2="44" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="128" y1="212" x2="128" y2="232" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="24" y1="128" x2="44" y2="128" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="212" y1="128" x2="232" y2="128" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="54" y1="54" x2="68" y2="68" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="188" y1="188" x2="202" y2="202" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="54" y1="202" x2="68" y2="188" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
                <line x1="188" y1="68" x2="202" y2="54" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
              </svg>
              <svg
                id="theme-icon-moon"
                width="19"
                height="19"
                viewBox="0 0 256 256"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M210.69 158.18A96.78 96.78 0 0 1 192 160 96.11 96.11 0 0 1 96 64a96.78 96.78 0 0 1 1.82-18.69A96.04 96.04 0 1 0 210.69 158.18Z"
                  stroke="currentColor"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn bag-trigger"
              id="bag-trigger"
              aria-label="Open order bag"
              onClick={() => setDrawerOpen(true)}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 256 256"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="32"
                  y="72"
                  width="192"
                  height="144"
                  rx="16"
                  stroke="currentColor"
                  strokeWidth="18"
                />
                <path
                  d="M88 72V64a40 40 0 0 1 80 0v8"
                  stroke="currentColor"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
              </svg>
              <span className="bag-count" id="bag-count">
                {totalQty}
              </span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* SECTION 1: Asymmetric Split Hero */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            id="hero-gl-canvas"
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">Built for altitude.</h1>
              <p className="hero-sub">
                A sturdy stainless steel bottle made for long trail days and
                everyday commutes, keeping drinks cold or steaming without ever
                sweating in your bag.
              </p>

              <div className="hero-actions">
                <a href="#order" className="btn btn-primary magnetic-btn">
                  Shop Flask
                </a>
                <a href="#showcase" className="btn btn-ghost">
                  Explore
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 256 256"
                    fill="none"
                    aria-hidden="true"
                  >
                    <line
                      x1="64"
                      y1="64"
                      x2="192"
                      y2="192"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="88 192 192 192 192 88"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="hero-stage" ref={heroStageRef} id="hero-stage">
              <div
                className="flask-tilt-wrap"
                ref={tiltWrapRef}
                id="flask-tilt-wrap"
              >
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-cutout.webp"
                  alt="Material Flask 950 ml in matte olive-sage green powder coat with black chug lid"
                  className="flask-hero-img"
                  id="hero-flask-img"
                  data-finish={finish}
                  width={519}
                  height={940}
                />
              </div>
              <div className="flask-shadow" ref={shadowRef} aria-hidden="true" />

              <div
                className="hero-swatches"
                role="radiogroup"
                aria-label="Select flask finish"
              >
                {(Object.keys(FINISH_META) as FinishId[]).map((key) => {
                  const meta = FINISH_META[key];
                  const isActive = finish === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      className={`swatch-btn${isActive ? ' is-active' : ''}`}
                      data-finish={key}
                      aria-checked={isActive}
                      aria-label={`${meta.name} finish`}
                      onClick={() => selectFinish(key)}
                    >
                      <span
                        className="swatch-dot"
                        style={{ background: meta.dot }}
                      />
                      <span className="swatch-label">{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Pinned 4-Angle Environmental Showcase */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport" id="showcase-viewport">
            <div className="showcase-frames" id="showcase-frames">
              {SHOWCASE_STAGES.map((stage, i) => (
                <figure
                  key={stage.src}
                  ref={(el: HTMLElement | null) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                  data-index={i}
                >
                  <img
                    src={stage.src}
                    alt={stage.alt}
                    className="showcase-img"
                  />
                </figure>
              ))}
            </div>

            <div className="showcase-hud">
              <div
                className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
                id="showcase-caption"
              >
                <h2 className="caption-title" id="caption-title">
                  {SHOWCASE_STAGES[activeStage].title}
                </h2>
                <p className="caption-sub" id="caption-sub">
                  {SHOWCASE_STAGES[activeStage].sub}
                </p>
              </div>

              <div
                className="showcase-dots"
                role="tablist"
                aria-label="Showcase angles"
              >
                {SHOWCASE_STAGES.map((stage, i) => (
                  <button
                    key={stage.title}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                    aria-label={`Angle ${i + 1}`}
                    onClick={() => selectStage(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Interactive Thermal Comparison Slider */}
        <section id="thermal" className="thermal-section">
          <div className="container thermal-grid">
            <div
              className="comparison-wrap"
              ref={compWrapRef}
              id="comparison-wrap"
              onPointerDown={handleCompPointerDown}
              onPointerMove={handleCompPointerMove}
              onPointerUp={handleCompPointerUp}
              onPointerCancel={handleCompPointerUp}
            >
              <div className="comparison-layer comparison-hot">
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-thermal-hot.webp"
                  alt="Material Flask in warm alpine sunrise light"
                  className="comparison-img"
                />
              </div>

              <div
                className="comparison-layer comparison-cold"
                id="comparison-cold"
                style={{
                  clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                  transition: splitAnimate
                    ? 'clip-path 380ms var(--ease-out)'
                    : 'none',
                }}
              >
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-thermal-cold.webp"
                  alt="Material Flask dry on frost-covered alpine ledge in sub-zero air"
                  className="comparison-img"
                />
              </div>

              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                id="comparison-handle"
                role="slider"
                tabIndex={0}
                aria-label="Compare cold and hot insulation"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(splitPct)}
                style={{
                  left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                  transition: splitAnimate
                    ? 'left 380ms var(--ease-out)'
                    : 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                  if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                }}
              >
                <div className="handle-line" />
                <div className="handle-knob">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 256 256"
                    fill="none"
                    aria-hidden="true"
                  >
                    <polyline
                      points="176 144 208 176 176 208"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="48"
                      y1="176"
                      x2="208"
                      y2="176"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="80 112 48 80 80 48"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="208"
                      y1="80"
                      x2="48"
                      y2="80"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="thermal-copy">
              <h2 className="section-title">Icy cold or piping hot.</h2>
              <p className="section-sub">
                Thick double-wall steel keeps water icy for 24 hours and morning
                coffee steaming for 12, while the outside stays completely dry.
              </p>

              <div
                className="segmented-control"
                role="tablist"
                aria-label="Thermal performance"
              >
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  24h Cold
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  12h Hot
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value">4°C</span>
                  <span className="metric-label">Cold retention</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">85°C</span>
                  <span className="metric-label">Heat retention</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Asymmetric 3-Tile Editorial Bento */}
        <section id="craft" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <h2 className="section-title">Engineered to endure.</h2>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-bento-lid.webp"
                  alt="Close-up of threaded black chug cap and brushed steel neck"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Leakproof Chug Lid</h3>
                  <p className="bento-sub">
                    Dual-threaded seal with integrated carry loop
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-bento-sunny.webp"
                  alt="Matte olive-sage green powder coat resting on sunlit trail timber"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Powder Coat</h3>
                  <p className="bento-sub">
                    Tactile matte grip that never slips wet
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-bottom reveal-tile">
                <canvas
                  ref={specsCanvasRef}
                  id="specs-gl-canvas"
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-footer bento-footer-specs">
                  <div>
                    <h3 className="bento-title">950 ml</h3>
                    <p className="bento-sub">520 g empty weight</p>
                  </div>
                  <span className="spec-badge">18/8 Steel</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 5: Interactive Finish & Size Configurator + Order */}
        <section id="order" className="order-section">
          <div className="container order-grid">
            <div className="order-preview" id="order-preview">
              <div
                className="order-plinth"
                aria-hidden="true"
                style={{
                  background: `radial-gradient(ellipse at center, ${FINISH_META[finish].dot}59 0%, transparent 72%)`,
                }}
              />
              <img
                src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-order-cutout.webp"
                alt={`Configured Material Flask in ${FINISH_META[finish].name}`}
                className="order-flask-img"
                id="order-flask-img"
                data-finish={finish}
                width={519}
                height={940}
                style={{ transform: `scale(${activeScale})` }}
              />
            </div>

            <div className="order-panel">
              <div className="order-title-row">
                <h2 className="section-title">Material Flask</h2>
                <button
                  type="button"
                  className={`icon-btn wishlist-heart-btn${isWishlisted ? ' is-saved' : ''}`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isWishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
                  onClick={toggleWishlist}
                >
                  <Heart size={19} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="order-price-stock-row">
                <p className="order-price" id="order-price">
                  ${price}
                </p>
                <span className="order-stock-text">
                  In Stock · Ships today from Boulder Hub
                </span>
              </div>

              <div className="config-group">
                <span className="config-label">
                  Finish — <strong style={{ color: 'var(--text-primary)' }}>{FINISH_META[finish].name}</strong>
                </span>
                <div className="option-row" id="order-finish-row">
                  {(Object.keys(FINISH_META) as FinishId[]).map((key) => {
                    const meta = FINISH_META[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`pill-option${
                          finish === key ? ' is-active' : ''
                        }`}
                        onClick={() => selectFinish(key)}
                      >
                        <span
                          className="dot"
                          style={{ background: meta.dot }}
                        />
                        {meta.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="config-group">
                <div className="config-label-row">
                  <span className="config-label">Capacity</span>
                  <button
                    type="button"
                    className="text-action-btn size-guide-link"
                    onClick={() => setSizeGuideOpen(true)}
                  >
                    <Ruler size={13} />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="option-row" id="order-size-row">
                  {SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.size}
                      type="button"
                      className={`pill-option${
                        size === opt.size ? ' is-active' : ''
                      }`}
                      onClick={() => {
                        selectSize(opt.size, opt.price);
                      }}
                    >
                      {opt.size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Quantity</span>
                <div className="config-qty-row">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Decrease configurator quantity"
                    onClick={() => setConfigQty((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className="bag-qty mono-num">{configQty}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Increase configurator quantity"
                    onClick={() => setConfigQty((q) => Math.min(10, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="spec-list">
                <div className="spec-row">
                  <span className="spec-key">Insulation</span>
                  <span className="spec-val">24h cold, 12h hot</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Steel</span>
                  <span className="spec-val">18/8 pro-grade double wall</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Warranty</span>
                  <span className="spec-val">Lifetime replacement</span>
                </div>
              </div>

              <div className="order-cta-stack">
                <button
                  type="button"
                  className="btn btn-primary btn-full magnetic-btn"
                  id="order-now-btn"
                  onClick={handleDirectOrder}
                >
                  <span className="btn-label">
                    Order Now · ${price * configQty}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-full"
                  id="add-to-bag-btn"
                  onClick={() => addToBag(true, configQty)}
                >
                  <span className="btn-label" id="add-to-bag-label">
                    Add to Bag - ${price * configQty}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Customer Reviews & Shipping/Warranty FAQ */}
        <ProductReviewsAndFaq
          reviews={reviews}
          defaultAuthor={userDetails.fullName}
          activeFinish={finish}
          activeSize={size}
          onAddReview={(rev) => setReviews((prev) => [rev, ...prev])}
        />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner footer-extended">
          <div className="footer-brand-col">
            <span className="footer-brand">Material</span>
            <span className="footer-tag">Built for altitude.</span>
          </div>

          <form
            className="footer-newsletter"
            onSubmit={(e) => {
              e.preventDefault();
              if (newsletterEmail.trim()) setNewsletterDone(true);
            }}
          >
            <label htmlFor="footer-email" className="sr-only">
              Email for new colorway drops
            </label>
            <input
              id="footer-email"
              type="email"
              className="field-input footer-email-input"
              placeholder="Email for colorway drops & trail notes"
              value={newsletterEmail}
              onChange={(e) => {
                setNewsletterEmail(e.target.value);
                setNewsletterDone(false);
              }}
              required
            />
            <button type="submit" className="btn btn-ghost btn-sm">
              {newsletterDone ? 'Subscribed' : 'Join'}
            </button>
          </form>

          <span className="footer-copy">© 2026 Material</span>
        </div>
      </footer>

      {/* Slide-Over Order Bag Drawer */}
      <div
        className="drawer-backdrop"
        id="drawer-backdrop"
        hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="bag-drawer"
        id="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        hidden={!drawerOpen}
        data-lenis-prevent
      >
        <div className="drawer-header">
          <h2 id="drawer-title" className="drawer-title">
            Bag
          </h2>
          <div className="drawer-header-actions">
            {bag.length > 0 && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Maximize to full checkout"
                title="Maximize to full checkout"
                onClick={handleCheckout}
              >
                <Maximize2 size={16} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              id="drawer-close"
              aria-label="Close bag"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="drawer-body" id="drawer-body">
          <div className="drawer-empty" id="drawer-empty" hidden={bag.length > 0}>
            <p>Your bag is empty.</p>
            <a
              href="#order"
              className="btn btn-primary btn-sm"
              id="drawer-empty-cta"
              onClick={() => setDrawerOpen(false)}
            >
              Select Flask
            </a>
          </div>

          <div className="drawer-items" id="drawer-items" hidden={bag.length === 0}>
            {/* Free Shipping Progress Meter in Drawer */}
            <div className="shipping-meter-box">
              <div className="shipping-meter-text">
                {drawerFreeShipRemaining === 0
                  ? 'Free Alpine Ground shipping unlocked'
                  : `Add ${formatMoney(drawerFreeShipRemaining)} more for Free Alpine Ground shipping`}
              </div>
              <div className="shipping-meter-bar">
                <div
                  className="shipping-meter-fill"
                  style={{
                    width: `${Math.min(100, (drawerBreakdown.subtotal / 75) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {bag.map((item, idx) => (
              <div key={`${item.finish}-${item.size}`} className="bag-item">
                <img
                  src="https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-order-cutout.webp"
                  alt="Material Flask"
                  className="bag-item-thumb"
                  data-finish={item.finish}
                />
                <div className="bag-item-info">
                  <div className="bag-item-name">Material Flask</div>
                  <div className="bag-item-meta">
                    {FINISH_META[item.finish].name} - {item.size} (${item.price})
                  </div>
                  <div className="bag-qty-row">
                    <button
                      type="button"
                      className="qty-btn"
                      aria-label="Decrease quantity"
                      onClick={() => updateBagQty(idx, -1)}
                    >
                      -
                    </button>
                    <span className="bag-qty mono-num">{item.qty}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      aria-label="Increase quantity"
                      onClick={() => updateBagQty(idx, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Promo Code Box in Drawer */}
            <div className="drawer-promo-section">
              <div className="drawer-promo-label">
                <Tag size={13} />
                <span>Promo Code</span>
              </div>
              <div className="promo-input-row">
                <input
                  type="text"
                  className="field-input mono-num"
                  placeholder="ALPINE15"
                  value={drawerPromoInput}
                  onChange={(e) =>
                    setDrawerPromoInput(e.target.value.toUpperCase())
                  }
                />
                {promoCode ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setPromoCode(null);
                      setDrawerPromoInput('');
                      setDrawerPromoFeedback(null);
                    }}
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleApplyDrawerPromo()}
                  >
                    Apply
                  </button>
                )}
              </div>
              {drawerPromoFeedback && (
                <div
                  className={`promo-feedback${
                    drawerPromoFeedback.type === 'ok' ? ' is-ok' : ' is-err'
                  }`}
                >
                  {drawerPromoFeedback.text}
                </div>
              )}
              <div className="drawer-promo-hints">
                {PROMO_CODES.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    className={`drawer-promo-hint-btn${
                      promoCode === p.code ? ' is-active' : ''
                    }`}
                    onClick={() => handleApplyDrawerPromo(p.code)}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer" id="drawer-footer" hidden={bag.length === 0}>
          {drawerBreakdown.discount > 0 && (
            <div className="drawer-discount-row">
              <span>Promo ({drawerBreakdown.appliedPromo?.code})</span>
              <span className="mono-num">-{formatMoney(drawerBreakdown.discount)}</span>
            </div>
          )}
          <div className="drawer-total-row">
            <span>Subtotal</span>
            <span className="drawer-total mono-num" id="drawer-total">
              {formatMoney(Math.max(0, drawerBreakdown.subtotal - drawerBreakdown.discount))}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full"
            id="checkout-btn"
            onClick={handleCheckout}
          >
            <Maximize2 size={16} />
            <span>Checkout &amp; Enter Details</span>
          </button>
        </div>
      </aside>

      {/* Incoming Email Notification Toast */}
      {emailToastOrder && (
        <div
          className="email-toast"
          role="status"
          aria-live="polite"
        >
          <div className="email-toast-icon" aria-hidden="true">
            <Mail size={18} />
          </div>
          <div className="email-toast-body">
            <div className="email-toast-kicker">
              Email sent to {emailToastOrder.user.email}
            </div>
            <div className="email-toast-title">
              Order {emailToastOrder.orderId} packed &amp; ready to ship
            </div>
            <div className="email-toast-actions">
              <button
                type="button"
                className="email-toast-btn"
                onClick={() => {
                  const id = emailToastOrder.orderId;
                  setEmailToastOrder(null);
                  setCheckoutOpen(false);
                  openTracker(id, 'email');
                }}
              >
                <Mail size={13} />
                <span>Open Email</span>
              </button>
              <button
                type="button"
                className="email-toast-btn"
                onClick={() => {
                  const id = emailToastOrder.orderId;
                  setEmailToastOrder(null);
                  setCheckoutOpen(false);
                  openTracker(id, 'track');
                }}
              >
                <Truck size={13} />
                <span>Track Truck</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            className="email-toast-close"
            aria-label="Dismiss notification"
            onClick={() => setEmailToastOrder(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Maximized Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        bag={bag}
        promoCode={promoCode}
        userDetails={userDetails}
        totalUserOrders={orders.length}
        onClose={() => {
          setCheckoutOpen(false);
          setCompletedOrder(null);
        }}
        onUpdateQty={updateBagQty}
        onApplyPromo={setPromoCode}
        onSaveUserDetails={setUserDetails}
        onOrderComplete={handleOrderComplete}
        onAdvanceOrderStage={handleAdvanceOrderStage}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={handleRequestReturn}
        completedOrder={completedOrder}
      />

      {/* Order Tracking & Email Inbox Modal */}
      <OrderTrackerModal
        isOpen={trackerOpen}
        orders={orders}
        initialOrderId={trackerInitialOrderId}
        initialView={trackerInitialView}
        currentUser={userDetails}
        onClose={() => setTrackerOpen(false)}
        onAdvanceStage={handleAdvanceOrderStage}
        onCancelOrder={handleCancelOrder}
        onRequestReturn={handleRequestReturn}
        onStartOrder={() => {
          setTrackerOpen(false);
          const el = document.getElementById('order');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Saved Wishlist Modal */}
      <WishlistModal
        isOpen={wishlistOpen}
        items={wishlist}
        onClose={() => setWishlistOpen(false)}
        onMoveToBag={(item) => {
          selectFinish(item.finish);
          selectSize(item.size, item.price);
          setWishlistOpen(false);
          setBag((prev) => {
            const idx = prev.findIndex(
              (b) => b.finish === item.finish && b.size === item.size
            );
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
              return next;
            }
            return [...prev, { ...item, qty: 1 }];
          });
          setDrawerOpen(true);
        }}
        onRemove={(f, s) =>
          setWishlist((prev) =>
            prev.filter((w) => !(w.finish === f && w.size === s))
          )
        }
      />

      {/* Size & Capacity Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        activeSize={size}
        onSelectSize={(nextSize, nextPrice) => selectSize(nextSize, nextPrice)}
        onClose={() => setSizeGuideOpen(false)}
      />
    </>
  );
}
