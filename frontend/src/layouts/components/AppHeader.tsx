import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, Typography, Space } from 'antd';
import NotificationBell from '@/layouts/components/NotificationBell';
import UserMenu from '@/layouts/components/UserMenu';

const { Header } = Layout;
const { Title } = Typography;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/prompts': 'Prompts',
  '/inbox': 'Inbox',
  '/calendar': 'Calendar',
  '/taxonomy': 'Taxonomy',
  '/settings': 'Settings',
};

export default function AppHeader() {
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    // Check for exact match first
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Check for prefix match (e.g. /prompts/123 -> Prompts)
    const basePath = '/' + path.split('/').filter(Boolean)[0];
    if (PAGE_TITLES[basePath]) return PAGE_TITLES[basePath];

    // Special cases
    if (path.startsWith('/articles/')) return 'Article Detail';

    return 'Global Shopping Insights';
  }, [location.pathname]);

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Title level={4} style={{ margin: 0 }}>
        {pageTitle}
      </Title>

      <Space size="middle">
        <NotificationBell />
        <UserMenu />
      </Space>
    </Header>
  );
}
