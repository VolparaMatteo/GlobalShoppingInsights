// ---------------------------------------------------------------------------
// components/common/RoleChip.tsx — Sprint 7 polish
//
// Chip ruolo utente (admin/editor/reviewer/contributor/read_only). Icona Lucide
// diversa per ruolo, gradient brand per admin, colori semantic per gli altri.
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';

import { Eye, Pen, ScanEye, ShieldCheck, User, type LucideIcon } from 'lucide-react';

import { ROLE_LABELS, type Role } from '@/config/constants';

interface RoleChipProps {
  role: string;
  size?: 'sm' | 'md';
}

interface RoleStyle {
  color: string;
  bg: string;
  icon: LucideIcon;
}

const STYLES: Record<Role, RoleStyle> = {
  admin: {
    color: 'var(--color-accent)',
    bg: 'var(--color-primary-bg)',
    icon: ShieldCheck,
  },
  reviewer: {
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-bg)',
    icon: ScanEye,
  },
  editor: {
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
    icon: Pen,
  },
  contributor: {
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-bg)',
    icon: User,
  },
  read_only: {
    color: 'var(--color-text-tertiary)',
    bg: 'var(--color-bg-layout)',
    icon: Eye,
  },
};

const SIZE_TOKENS = {
  sm: { font: 11, padding: '2px 7px', iconSize: 12, gap: 4 },
  md: { font: 12, padding: '3px 9px', iconSize: 14, gap: 5 },
} as const;

export default function RoleChip({ role, size = 'md' }: RoleChipProps) {
  const typedRole = role as Role;
  const meta = STYLES[typedRole];
  const label = ROLE_LABELS[typedRole] ?? role;

  if (!meta) {
    return (
      <span style={{ color: 'var(--color-text-tertiary)', fontSize: SIZE_TOKENS[size].font }}>
        {label}
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
    border: `1px solid ${meta.color}33`,
    borderRadius: 'var(--border-radius-xl)',
  };

  return (
    <span style={style} aria-label={`Ruolo: ${label}`}>
      <Icon size={tokens.iconSize} strokeWidth={2.2} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
