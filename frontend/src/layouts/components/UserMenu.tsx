// ---------------------------------------------------------------------------
// UserMenu.tsx — dropdown user nell'header (companion del SidebarUserCard)
// ---------------------------------------------------------------------------
import { Avatar, Dropdown, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ROLE_LABELS, type Role } from '@/config/constants';
import { useAuthStore } from '@/stores/authStore';

const { Text } = Typography;

function initialsFromName(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENT = 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)';

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const displayName = user?.name ?? 'Utente';
  const avatarUrl = user?.avatar_url ?? null;
  const initials = initialsFromName(user?.name);
  const roleLabel = ROLE_LABELS[(user?.role as Role) ?? 'read_only'] ?? 'Utente';

  const menuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{roleLabel}</div>
        </div>
      ),
      disabled: true,
      style: { cursor: 'default' },
    },
    { type: 'divider' },
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
      onClick: logout,
    },
  ];

  const avatar = avatarUrl ? (
    <Avatar size={32} src={avatarUrl} alt={displayName} />
  ) : (
    <Avatar
      size={32}
      style={{
        background: AVATAR_GRADIENT,
        color: '#ffffff',
        fontWeight: 600,
        fontSize: 12.5,
      }}
    >
      {initials}
    </Avatar>
  );

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer', padding: '0 4px' }}>
        {avatar}
        <Text style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
          {displayName}
        </Text>
      </Space>
    </Dropdown>
  );
}
