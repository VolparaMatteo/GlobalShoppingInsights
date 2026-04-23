// ---------------------------------------------------------------------------
// SidebarUserCard.tsx — Sprint 7 polish b5
//
// Card utente nel footer della sidebar: avatar + nome + ruolo + dropdown
// con azioni (profilo / esci).
// ---------------------------------------------------------------------------
import { Avatar, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { LogOut, User as UserIcon, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ROLE_LABELS, type Role } from '@/config/constants';
import { useConfirmLogout } from '@/hooks/useConfirmLogout';
import { useAuthStore } from '@/stores/authStore';

interface SidebarUserCardProps {
  collapsed?: boolean;
}

function initialsFromName(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENT = 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)';

export default function SidebarUserCard({ collapsed = false }: SidebarUserCardProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const confirmLogout = useConfirmLogout();

  const displayName = user?.name ?? 'Utente';
  const roleLabel = ROLE_LABELS[(user?.role as Role) ?? 'read_only'] ?? 'Utente';
  const initials = initialsFromName(user?.name);
  const avatarUrl = user?.avatar_url ?? null;

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserIcon size={14} />,
      label: 'Il mio profilo',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: 'Esci',
      danger: true,
      onClick: confirmLogout,
    },
  ];

  const avatar = avatarUrl ? (
    <Avatar
      size={collapsed ? 34 : 32}
      src={avatarUrl}
      alt={displayName}
      style={{
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(22,119,255,0.25)',
        border: '1.5px solid rgba(255,255,255,0.15)',
      }}
    />
  ) : (
    <Avatar
      size={collapsed ? 34 : 32}
      style={{
        background: AVATAR_GRADIENT,
        color: '#ffffff',
        fontWeight: 600,
        fontSize: collapsed ? 13 : 12.5,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(22,119,255,0.35)',
      }}
    >
      {initials}
    </Avatar>
  );

  if (collapsed) {
    return (
      <Dropdown menu={{ items: menuItems }} placement="topRight" trigger={['click']}>
        <Tooltip title={`${displayName} — ${roleLabel}`} placement="right">
          <button type="button" style={collapsedButtonStyle} aria-label="Apri menu utente">
            {avatar}
          </button>
        </Tooltip>
      </Dropdown>
    );
  }

  return (
    <Dropdown menu={{ items: menuItems }} placement="topRight" trigger={['click']}>
      <button type="button" style={expandedButtonStyle} aria-label="Apri menu utente">
        {avatar}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: 1,
            minWidth: 0,
            gap: 1,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {roleLabel}
          </span>
        </div>
        <ChevronsUpDown
          size={14}
          color="rgba(255,255,255,0.45)"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        />
      </button>
    </Dropdown>
  );
}

const expandedButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
} as const;

const collapsedButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  width: '100%',
} as const;
