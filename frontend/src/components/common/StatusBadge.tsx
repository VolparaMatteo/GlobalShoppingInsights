// ---------------------------------------------------------------------------
// components/common/StatusBadge.tsx — Sprint 7 polish
//
// Badge custom per lo stato workflow dell'articolo. Sostituisce il Tag AntD
// generico con:
//   - colori semantic dai tokens (cambiano in dark mode)
//   - icona Lucide associata (contesto a colpo d'occhio)
//   - bordo + bg tinteggiato + testo colorato per contrasto WCAG AA
//
// API retrocompatibile: <StatusBadge status="approved" />
// ---------------------------------------------------------------------------
import type { CSSProperties, ReactNode } from 'react';

import {
  CheckCircle2,
  CircleCheck,
  CircleDashed,
  Clock,
  FileSearch,
  Send,
  Upload,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { STATUS_MAP, type ArticleStatus } from '@/config/constants';

interface StatusBadgeProps {
  status: string;
  /** Se true nasconde il label, mostra solo l'icona (compact UI). */
  iconOnly?: boolean;
  /** Dimensione testuale (default 12, lg=13). */
  size?: 'sm' | 'md' | 'lg';
}

interface Meta {
  label: string;
  color: string; // foreground
  bg: string; // background tinted
  icon: LucideIcon;
}

const META: Record<ArticleStatus, Meta> = {
  imported: {
    label: 'Importato',
    color: 'var(--status-imported)',
    bg: 'var(--color-bg-layout)',
    icon: Upload,
  },
  screened: {
    label: 'Visualizzato',
    color: 'var(--status-screened)',
    bg: 'var(--color-primary-bg)',
    icon: FileSearch,
  },
  in_review: {
    label: 'In Revisione',
    color: 'var(--status-in-review)',
    bg: 'var(--color-warning-bg)',
    icon: Clock,
  },
  approved: {
    label: 'Approvato',
    color: 'var(--status-approved)',
    bg: 'var(--color-success-bg)',
    icon: CheckCircle2,
  },
  scheduled: {
    label: 'Pianificato',
    color: 'var(--status-scheduled)',
    bg: 'var(--color-primary-bg)',
    icon: CircleDashed,
  },
  publishing: {
    label: 'In Pubblicazione',
    color: 'var(--status-publishing)',
    bg: 'var(--color-info-bg)',
    icon: Send,
  },
  published: {
    label: 'Pubblicato',
    color: 'var(--status-published)',
    bg: 'var(--color-success-bg)',
    icon: CircleCheck,
  },
  publish_failed: {
    label: 'Pubblicazione Fallita',
    color: 'var(--status-publish-failed)',
    bg: 'var(--color-error-bg)',
    icon: XCircle,
  },
  rejected: {
    label: 'Scartato',
    color: 'var(--status-rejected)',
    bg: 'var(--color-error-bg)',
    icon: XCircle,
  },
};

const SIZE_TOKENS = {
  sm: { font: 11, padding: '2px 7px', iconSize: 12, gap: 4 },
  md: { font: 12, padding: '3px 9px', iconSize: 14, gap: 5 },
  lg: { font: 13, padding: '4px 11px', iconSize: 15, gap: 6 },
} as const;

export default function StatusBadge({
  status,
  iconOnly = false,
  size = 'md',
}: StatusBadgeProps): ReactNode {
  const meta = META[status as ArticleStatus];
  const fallbackLabel = STATUS_MAP[status as ArticleStatus]?.label ?? status;

  if (!meta) {
    return (
      <span style={legacyStyle('var(--color-text-tertiary)', 'var(--color-bg-layout)', size)}>
        {fallbackLabel}
      </span>
    );
  }

  const Icon = meta.icon;
  const tokens = SIZE_TOKENS[size];
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.gap,
    padding: tokens.padding,
    fontSize: tokens.font,
    fontWeight: 500,
    lineHeight: 1,
    color: meta.color,
    background: meta.bg,
    border: `1px solid ${meta.color}33`, // 20% alpha
    borderRadius: 'var(--border-radius-md)',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} aria-label={`Stato: ${meta.label}`}>
      <Icon size={tokens.iconSize} strokeWidth={2.2} aria-hidden="true" />
      {!iconOnly && <span>{meta.label}</span>}
    </span>
  );
}

function legacyStyle(color: string, bg: string, size: 'sm' | 'md' | 'lg'): CSSProperties {
  const t = SIZE_TOKENS[size];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: t.padding,
    fontSize: t.font,
    color,
    background: bg,
    border: '1px solid var(--color-border-secondary)',
    borderRadius: 'var(--border-radius-md)',
    whiteSpace: 'nowrap',
  };
}
