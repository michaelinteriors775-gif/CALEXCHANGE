import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
});

export const ChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const SwapIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></svg>
);
export const CopyIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
);
export const HistoryIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
);
export const KeyboardIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></svg>
);
export const GlobeIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></svg>
);

/**
 * CALEXCHANGE logo: a calculator whose display is a banknote, the note's seal
 * an equals sign. Same artwork as public/brand/logo.svg.
 */
export const Logo = ({ size = 32, ...p }: IconProps & { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable={false} {...p}>
    <rect x="2" y="2" width="60" height="60" rx="15" fill="#1f2124" />
    <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="14.25" fill="none" stroke="#3a3d41" strokeWidth="1.5" />
    <rect x="10" y="7.5" width="44" height="20" rx="4" fill="#1b7d4c" transform="rotate(-6 32 17.5)" />
    <rect x="9" y="11" width="46" height="20" rx="4" fill="#2fcf7f" />
    <rect x="12" y="14" width="40" height="14" rx="2.5" fill="none" stroke="#c9f7dc" strokeOpacity=".6" strokeWidth="1.1" />
    <circle cx="32" cy="21" r="5.6" fill="#103f27" />
    <rect x="28.6" y="18.6" width="6.8" height="1.7" rx=".85" fill="#2fcf7f" />
    <rect x="28.6" y="21.7" width="6.8" height="1.7" rx=".85" fill="#2fcf7f" />
    <rect x="9" y="36" width="13" height="10" rx="3" fill="#5c6167" />
    <rect x="25.5" y="36" width="13" height="10" rx="3" fill="#5c6167" />
    <rect x="9" y="49" width="13" height="10" rx="3" fill="#5c6167" />
    <rect x="25.5" y="49" width="13" height="10" rx="3" fill="#5c6167" />
    <rect x="42" y="36" width="13" height="23" rx="3" fill="#ff6a13" />
  </svg>
);
