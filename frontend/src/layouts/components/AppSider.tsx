import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  SearchOutlined,
  InboxOutlined,
  CalendarOutlined,
  TagsOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed: boolean;
}

export default function AppSider({ collapsed }: AppSiderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const toggleSider = useUiStore((s) => s.toggleSider);

  const isAdmin = user?.role === 'admin';

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/prompts',
        icon: <SearchOutlined />,
        label: 'Prompt',
      },
      {
        key: '/inbox',
        icon: <InboxOutlined />,
        label: 'Posta in Arrivo',
      },
      {
        key: '/calendar',
        icon: <CalendarOutlined />,
        label: 'Calendario',
      },
      {
        key: '/taxonomy',
        icon: <TagsOutlined />,
        label: 'Tassonomia',
      },
    ];

    if (isAdmin) {
      items.push({
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Impostazioni',
      });
    }

    return items;
  }, [isAdmin]);

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    // Match the first two segments for nested routes (e.g. /prompts/123 -> /prompts)
    const match = menuItems?.find((item) =>
      item && 'key' in item ? path.startsWith(item.key as string) : false,
    );
    return match && 'key' in match ? (match.key as string) : '/dashboard';
  }, [location.pathname, menuItems]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={toggleSider}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: collapsed ? 16 : 18,
          padding: '16px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {collapsed ? 'GSI' : 'Global Shopping'}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
}
