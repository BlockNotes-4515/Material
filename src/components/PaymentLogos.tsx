import React from 'react';

export const StripeLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 64 26" fill="none" aria-hidden="true">
    <rect width="64" height="26" rx="5" fill="#635BFF" />
    <text
      x="32"
      y="17.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontFamily="var(--font-sans)"
      fontWeight="700"
      fontSize="13"
      letterSpacing="-0.03em"
    >
      stripe
    </text>
  </svg>
);

export const PayPalLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 74 26" fill="none" aria-hidden="true">
    <rect width="74" height="26" rx="5" fill="#003087" />
    <text
      x="11"
      y="17.5"
      fill="#FFFFFF"
      fontFamily="var(--font-sans)"
      fontWeight="700"
      fontSize="12"
      fontStyle="italic"
    >
      Pay
    </text>
    <text
      x="34"
      y="17.5"
      fill="#009CDE"
      fontFamily="var(--font-sans)"
      fontWeight="700"
      fontSize="12"
      fontStyle="italic"
    >
      Pal
    </text>
  </svg>
);

export const GooglePayLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 68 26" fill="none" aria-hidden="true">
    <rect
      x="0.5"
      y="0.5"
      width="67"
      height="25"
      rx="4.5"
      fill="#FFFFFF"
      stroke="rgba(17,22,20,0.18)"
    />
    <path
      d="M21.2 13.2c0-.5 0-1-.1-1.4h-6.1v2.6h3.5c-.1.8-.6 1.5-1.3 2v1.7h2.1c1.2-1.1 1.9-2.8 1.9-4.9z"
      fill="#4285F4"
    />
    <path
      d="M15 19.5c1.7 0 3.2-.6 4.3-1.6l-2.1-1.7c-.6.4-1.3.6-2.2.6-1.7 0-3.1-1.1-3.6-2.7H9.2v1.7c1.1 2.2 3.3 3.7 5.8 3.7z"
      fill="#34A853"
    />
    <path
      d="M11.4 14.1c-.1-.4-.2-.8-.2-1.2s.1-.8.2-1.2V10H9.2c-.5.9-.7 1.9-.7 2.9s.2 2 .7 2.9l2.2-1.7z"
      fill="#FBBC05"
    />
    <path
      d="M15 9.1c.9 0 1.8.3 2.5 1l1.8-1.8C18.2 7.2 16.7 6.5 15 6.5c-2.5 0-4.7 1.5-5.8 3.7l2.2 1.7c.5-1.6 1.9-2.8 3.6-2.8z"
      fill="#EA4335"
    />
    <text
      x="26"
      y="17.2"
      fill="#3C4043"
      fontFamily="var(--font-sans)"
      fontWeight="600"
      fontSize="11.5"
    >
      Pay
    </text>
  </svg>
);

export const PhonePeLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 82 26" fill="none" aria-hidden="true">
    <rect width="82" height="26" rx="5" fill="#5F259F" />
    <circle cx="14" cy="13" r="7.5" fill="#FFFFFF" />
    <text
      x="14"
      y="16.8"
      textAnchor="middle"
      fill="#5F259F"
      fontFamily="var(--font-sans)"
      fontWeight="700"
      fontSize="11"
    >
      पे
    </text>
    <text
      x="26"
      y="17"
      fill="#FFFFFF"
      fontFamily="var(--font-sans)"
      fontWeight="700"
      fontSize="11.5"
    >
      PhonePe
    </text>
  </svg>
);

export const PaytmLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 70 26" fill="none" aria-hidden="true">
    <rect
      x="0.5"
      y="0.5"
      width="69"
      height="25"
      rx="4.5"
      fill="#FFFFFF"
      stroke="rgba(17,22,20,0.18)"
    />
    <text
      x="10"
      y="17"
      fill="#002970"
      fontFamily="var(--font-sans)"
      fontWeight="800"
      fontSize="12"
    >
      Pay
    </text>
    <text
      x="33"
      y="17"
      fill="#00BAF2"
      fontFamily="var(--font-sans)"
      fontWeight="800"
      fontSize="12"
    >
      tm
    </text>
  </svg>
);

export const ApplePayLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 68 26" fill="none" aria-hidden="true">
    <rect width="68" height="26" rx="5" fill="#111614" />
    <path
      d="M18.3 10.6c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.6-.4 2.1-1zm.7 1.3c-1.2-.1-2.2.7-2.8.7-.6 0-1.5-.6-2.4-.6-1.3 0-2.4.7-3.1 1.8-1.3 2.3-.3 5.7.9 7.6.6.9 1.3 1.9 2.3 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6 1.6-.9 2.2-1.8c.7-1 1-2 1-2.1-.1 0-1.9-.7-1.9-2.8 0-1.8 1.4-2.6 1.5-2.7-.8-1.2-2.1-1.9-2.5-2z"
      fill="#FFFFFF"
      transform="translate(2, -1.5) scale(0.85)"
    />
    <text
      x="27"
      y="17.2"
      fill="#FFFFFF"
      fontFamily="var(--font-sans)"
      fontWeight="600"
      fontSize="11.5"
    >
      Pay
    </text>
  </svg>
);

export const CardNetworkBadges: React.FC = () => (
  <div className="card-network-badges" aria-label="Accepted card networks">
    <span className="card-net-chip is-visa">VISA</span>
    <span className="card-net-chip is-mc">
      <span className="mc-dot mc-red" />
      <span className="mc-dot mc-amber" />
    </span>
    <span className="card-net-chip is-amex">AMEX</span>
    <span className="card-net-chip is-rupay">RuPay</span>
  </div>
);

export const CodBadgeLogo: React.FC = () => (
  <svg height="20" viewBox="0 0 56 26" fill="none" aria-hidden="true">
    <rect
      x="0.5"
      y="0.5"
      width="55"
      height="25"
      rx="4.5"
      fill="var(--surface-elevated)"
      stroke="var(--border-strong)"
    />
    <text
      x="28"
      y="16.8"
      textAnchor="middle"
      fill="var(--text-primary)"
      fontFamily="var(--font-mono)"
      fontWeight="700"
      fontSize="11"
    >
      COD
    </text>
  </svg>
);
