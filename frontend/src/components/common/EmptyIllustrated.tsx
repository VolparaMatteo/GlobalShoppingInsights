// ---------------------------------------------------------------------------
// components/common/EmptyIllustrated.tsx — Sprint 7 polish b2
//
// Empty state illustrato con SVG inline. Più "caldo" del placeholder Empty di
// AntD. Varianti per contesto (inbox / calendar / prompts / search / alerts).
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Button, Typography } from 'antd';

type Variant = 'inbox' | 'search' | 'calendar' | 'prompts' | 'alerts' | 'generic';

interface EmptyIllustratedProps {
  variant?: Variant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function EmptyIllustrated({
  variant = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyIllustratedProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 20, opacity: 0.9 }}>
        <Illustration variant={variant} />
      </div>
      <Typography.Title level={5} style={{ margin: 0, marginBottom: 6 }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Text type="secondary" style={{ maxWidth: 420, fontSize: 13, lineHeight: 1.5 }}>
          {description}
        </Typography.Text>
      )}
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction} style={{ marginTop: 18 }}>
          {actionLabel}
        </Button>
      )}
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );
}

function Illustration({ variant }: { variant: Variant }) {
  // Palette: usa gradient token-based via stopColor con CSS vars.
  const gradId = `gsi-empty-${variant}`;
  const base = (
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.18" />
        <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0.08" />
      </linearGradient>
    </defs>
  );

  const size = 140;
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 120 120',
    fill: 'none',
    role: 'img' as const,
    'aria-hidden': true,
  };

  switch (variant) {
    case 'inbox':
      return (
        <svg {...props}>
          {base}
          <rect x="14" y="24" width="92" height="72" rx="10" fill={`url(#${gradId})`} />
          <path
            d="M14 64 l24-22 h14 l6 10 h16 l6-10 h14 l24 22"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect
            x="44"
            y="44"
            width="32"
            height="4"
            rx="2"
            fill="var(--color-primary)"
            opacity="0.4"
          />
          <rect
            x="48"
            y="52"
            width="24"
            height="3"
            rx="1.5"
            fill="var(--color-primary)"
            opacity="0.3"
          />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          {base}
          <circle cx="52" cy="52" r="28" fill={`url(#${gradId})`} />
          <circle
            cx="52"
            cy="52"
            r="24"
            stroke="var(--color-primary)"
            strokeWidth="3"
            fill="transparent"
          />
          <line
            x1="72"
            y1="72"
            x2="96"
            y2="96"
            stroke="var(--color-primary)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="45" cy="45" r="5" fill="var(--color-primary)" opacity="0.6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          {base}
          <rect x="18" y="26" width="84" height="72" rx="8" fill={`url(#${gradId})`} />
          <rect
            x="18"
            y="26"
            width="84"
            height="18"
            rx="8"
            fill="var(--color-accent)"
            opacity="0.4"
          />
          <line
            x1="36"
            y1="18"
            x2="36"
            y2="34"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="84"
            y1="18"
            x2="84"
            y2="34"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={32 + c * 18}
                cy={58 + r * 14}
                r="3"
                fill="var(--color-accent)"
                opacity={0.3 + r * 0.15}
              />
            )),
          )}
        </svg>
      );
    case 'prompts':
      return (
        <svg {...props}>
          {base}
          <rect x="20" y="20" width="64" height="76" rx="8" fill={`url(#${gradId})`} />
          <rect
            x="30"
            y="32"
            width="44"
            height="4"
            rx="2"
            fill="var(--color-primary)"
            opacity="0.5"
          />
          <rect
            x="30"
            y="42"
            width="30"
            height="3"
            rx="1.5"
            fill="var(--color-primary)"
            opacity="0.3"
          />
          <rect
            x="30"
            y="52"
            width="38"
            height="3"
            rx="1.5"
            fill="var(--color-primary)"
            opacity="0.3"
          />
          <circle cx="88" cy="88" r="14" fill="var(--color-accent)" opacity="0.2" />
          <path d="M82 88 l6 -6 v4 h8 v4 h-8 v4 z" fill="var(--color-accent)" />
        </svg>
      );
    case 'alerts':
      return (
        <svg {...props}>
          {base}
          <path d="M60 18 l42 70 h-84 z" fill={`url(#${gradId})`} />
          <circle cx="60" cy="68" r="3" fill="var(--color-success)" />
          <rect x="58" y="42" width="4" height="20" rx="2" fill="var(--color-success)" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          {base}
          <circle cx="60" cy="60" r="48" fill={`url(#${gradId})`} />
          <path
            d="M42 60 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 z"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle cx="54" cy="56" r="3" fill="var(--color-primary)" />
          <circle cx="66" cy="56" r="3" fill="var(--color-primary)" />
          <path
            d="M50 68 q10 8 20 0"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
      );
  }
}
