import { Dropdown, Avatar, Typography, Tag, Space } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  editor: 'blue',
  viewer: 'green',
};

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.name ?? 'Utente';
  const role = user?.role ?? 'viewer';

  const menuItems: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <Space direction="vertical" size={2} style={{ padding: '4px 0' }}>
          <Text strong>{displayName}</Text>
          <Tag color={ROLE_COLORS[role] ?? 'default'}>{role}</Tag>
        </Space>
      ),
      disabled: true,
      style: { cursor: 'default' },
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Esci',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer' }}>
        <Avatar size="small" icon={<UserOutlined />} />
        <Text style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </Text>
      </Space>
    </Dropdown>
  );
}
