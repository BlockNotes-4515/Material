import React, { useEffect, useState } from 'react';
import { ORDER_STAGES } from '../types/order';

interface ShippingDispatchGraphicProps {
  stageIndex: number; // 0: placed, 1: packed, 2: shipped, 3: in_transit, 4: delivered
  compact?: boolean;
}

export const ShippingDispatchGraphic: React.FC<ShippingDispatchGraphicProps> = ({
  stageIndex,
  compact = false,
}) => {
  const safeIdx = Math.max(0, Math.min(4, stageIndex));
  const stageMeta = ORDER_STAGES[safeIdx];

  const targetPct =
    safeIdx === 0
      ? 14
      : safeIdx === 1
      ? 28
      : safeIdx === 2
      ? 50
      : safeIdx === 3
      ? 72
      : 87;

  // Drive-out entrance from the box hub so the truck visibly pulls onto the road
  const [displayPct, setDisplayPct] = useState<number>(12);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDisplayPct(targetPct);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [targetPct]);

  const isMoving = safeIdx >= 1 && safeIdx < 4;

  return (
    <div className={`dispatch-scene${compact ? ' is-compact' : ''}`}>
      <div className="dispatch-scene-header">
        <div className="dispatch-scene-kicker">
          <span className="dispatch-stage-index">
            0{safeIdx + 1} / 05
          </span>
          <span aria-hidden="true">·</span>
          <span className="dispatch-stage-name">{stageMeta.label}</span>
        </div>
        <span className="dispatch-scene-location">{stageMeta.defaultLocation}</span>
      </div>

      <div
        className={`dispatch-canvas${isMoving ? ' is-moving' : ''}`}
        aria-hidden="true"
      >
        {/* Parallax Alpine Contour Ridge */}
        <div className="dispatch-ridge-track">
          <svg
            className="dispatch-ridge"
            viewBox="0 0 640 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 98 L85 52 L145 78 L235 28 L315 74 L405 36 L495 80 L570 46 L640 84 L640 120 L0 120 Z"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M0 98 L85 52 L145 78 L235 28 L315 74 L405 36 L495 80 L570 46 L640 84"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.18"
            />
          </svg>
          <svg
            className="dispatch-ridge"
            viewBox="0 0 640 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 98 L85 52 L145 78 L235 28 L315 74 L405 36 L495 80 L570 46 L640 84 L640 120 L0 120 Z"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M0 98 L85 52 L145 78 L235 28 L315 74 L405 36 L495 80 L570 46 L640 84"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.18"
            />
          </svg>
        </div>

        {/* Origin Hub Box Station */}
        <div className={`dispatch-hub${safeIdx >= 1 ? ' is-sealed' : ''}`}>
          <svg width="46" height="46" viewBox="0 0 64 64" fill="none">
            <rect
              x="10"
              y="22"
              width="44"
              height="34"
              rx="4"
              fill="var(--surface-elevated)"
              stroke="var(--border-strong)"
              strokeWidth="2"
            />
            <path
              d={
                safeIdx >= 1
                  ? 'M10 22 L32 22 L54 22'
                  : 'M10 22 L2 14 L24 14 L32 22 M54 22 L62 14 L40 14 L32 22'
              }
              stroke="var(--border-strong)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <rect
              x="27"
              y="22"
              width="10"
              height={safeIdx >= 1 ? 18 : 6}
              rx="1.5"
              fill="var(--accent)"
              opacity={safeIdx >= 1 ? 0.92 : 0.45}
            />
            <path
              d="M22 46 L29 36 L34 42 L38 38 L43 46 Z"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Highway Track + Scrolling Dashed Lane */}
        <div className="dispatch-road">
          <div className="dispatch-road-dashes" />
          <div
            className="dispatch-road-fill"
            style={{ width: `${displayPct}%` }}
          />
        </div>

        {/* Moving Delivery Truck Carrying Packed Box */}
        <div
          className={`dispatch-truck${isMoving ? ' is-rolling' : ''}`}
          style={{ left: `${displayPct}%` }}
        >
          <svg width="108" height="48" viewBox="0 0 116 56" fill="none">
            {/* Animated Motion / Wind Streaks Behind Truck */}
            {isMoving && (
              <g className="truck-wind-lines">
                <line
                  x1="2"
                  y1="17"
                  x2="18"
                  y2="17"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="6"
                  y1="25"
                  x2="19"
                  y2="25"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="0"
                  y1="33"
                  x2="16"
                  y2="33"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Chassis / Suspension Group */}
            <g className="truck-body-group">
              {/* Cargo Container */}
              <rect
                x="24"
                y="10"
                width="52"
                height="32"
                rx="4"
                fill="var(--accent)"
              />
              {/* Packed Box Inside Cargo Window */}
              <rect
                x="32"
                y="17"
                width="18"
                height="16"
                rx="2"
                fill="var(--accent-text)"
                opacity="0.94"
              />
              <path
                d="M41 17 V24"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              {/* Alpine Silhouette on Truck Side */}
              <path
                d="M54 33 L60 22 L64 28 L67 24 L72 33 Z"
                fill="var(--accent-text)"
                opacity="0.72"
              />
              {/* Truck Cab */}
              <path
                d="M76 18 H93 C97 18 100 20 102 24 L107 32 V42 H76 V18 Z"
                fill="var(--text-primary)"
              />
              {/* Windshield */}
              <path
                d="M82 22 H92 C94.5 22 96.5 23.5 98 26 L101 31 H82 V22 Z"
                fill="var(--bg)"
                opacity="0.92"
              />
              {/* Headlight Beam */}
              {isMoving && (
                <polygon
                  points="107,33 116,29 116,40 107,37"
                  fill="var(--accent)"
                  opacity="0.5"
                />
              )}
            </g>

            {/* Rotating Spoked Rear Wheel */}
            <g className="truck-wheel-wrap" style={{ transformOrigin: '42px 44px' }}>
              <circle cx="42" cy="44" r="7" fill="var(--text-primary)" />
              <circle cx="42" cy="44" r="3.2" fill="var(--bg)" />
              <line x1="42" y1="38.5" x2="42" y2="49.5" stroke="var(--bg)" strokeWidth="1.2" />
              <line x1="36.5" y1="44" x2="47.5" y2="44" stroke="var(--bg)" strokeWidth="1.2" />
            </g>

            {/* Rotating Spoked Front Wheel */}
            <g className="truck-wheel-wrap" style={{ transformOrigin: '92px 44px' }}>
              <circle cx="92" cy="44" r="7" fill="var(--text-primary)" />
              <circle cx="92" cy="44" r="3.2" fill="var(--bg)" />
              <line x1="92" y1="38.5" x2="92" y2="49.5" stroke="var(--bg)" strokeWidth="1.2" />
              <line x1="86.5" y1="44" x2="97.5" y2="44" stroke="var(--bg)" strokeWidth="1.2" />
            </g>
          </svg>
        </div>

        {/* Destination Pin */}
        <div className={`dispatch-dest${safeIdx === 4 ? ' is-arrived' : ''}`}>
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
            <path
              d="M14 2C7.925 2 3 6.925 3 13C3 21.25 14 32 14 32C14 32 25 21.25 25 13C25 6.925 20.075 2 14 2Z"
              fill={safeIdx === 4 ? 'var(--accent)' : 'var(--surface-elevated)'}
              stroke={safeIdx === 4 ? 'var(--accent)' : 'var(--border-strong)'}
              strokeWidth="2"
            />
            <circle
              cx="14"
              cy="13"
              r="4"
              fill={safeIdx === 4 ? 'var(--accent-text)' : 'var(--text-secondary)'}
            />
          </svg>
        </div>
      </div>

      <p className="dispatch-scene-desc">{stageMeta.defaultDetail}</p>
    </div>
  );
};
