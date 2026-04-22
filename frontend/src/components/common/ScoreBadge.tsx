// ---------------------------------------------------------------------------
// components/common/ScoreBadge.tsx — Sprint 7 polish
//
// Indicatore circolare del punteggio AI di rilevanza (0-100).
// Colore: >=75 verde, >=50 arancione, <50 rosso. Tooltip con label testuale.
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';
import { Tooltip } from 'antd';

import { SCORE_THRESHOLDS } from '@/config/constants';

interface ScoreBadgeProps {
  score: number | null | undefined;
  /** 'circle' (default) | 'pill' per inline UI. */
  variant?: 'circle' | 'pill';
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_TOKENS = {
  sm: { diameter: 28, font: 11 },
  md: { diameter: 36, font: 13 },
  lg: { diameter: 48, font: 15 },
} as const;

function scoreColor(score: number): { fg: string; bg: string; label: string } {
  if (score >= SCORE_THRESHOLDS.high) {
    return {
      fg: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      label: 'Alta rilevanza',
    };
  }
  if (score >= SCORE_THRESHOLDS.medium) {
    return {
      fg: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      label: 'Media rilevanza',
    };
  }
  return {
    fg: 'var(--color-error)',
    bg: 'var(--color-error-bg)',
    label: 'Bassa rilevanza',
  };
}

export default function ScoreBadge({ score, variant = 'circle', size = 'md' }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}
        aria-label="Punteggio non disponibile"
      >
        —
      </span>
    );
  }

  const s = Math.max(0, Math.min(100, Math.round(score)));
  const { fg, bg, label } = scoreColor(s);
  const tokens = SIZE_TOKENS[size];

  if (variant === 'pill') {
    const pillStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      fontSize: tokens.font,
      fontWeight: 600,
      lineHeight: 1,
      color: fg,
      background: bg,
      border: `1px solid ${fg}33`,
      borderRadius: 'var(--border-radius-xl)',
    };
    return (
      <Tooltip title={`${label} (${s}/100)`}>
        <span style={pillStyle} aria-label={`Punteggio AI: ${s} su 100 — ${label}`}>
          {s}
        </span>
      </Tooltip>
    );
  }

  const circleStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: tokens.diameter,
    height: tokens.diameter,
    borderRadius: '50%',
    background: bg,
    border: `2px solid ${fg}`,
    color: fg,
    fontWeight: 700,
    fontSize: tokens.font,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <Tooltip title={`${label} (${s}/100)`}>
      <span style={circleStyle} aria-label={`Punteggio AI: ${s} su 100 — ${label}`}>
        {s}
      </span>
    </Tooltip>
  );
}
