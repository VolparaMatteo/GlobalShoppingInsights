import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, Typography, Space, theme as antdTheme } from 'antd';
import NotificationBell from '@/layouts/components/NotificationBell';
import UserMenu from '@/layouts/components/UserMenu';
import ThemeToggle from '@/components/common/ThemeToggle';

const { Header } = Layout;
const { Title } = Typography;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/prompts': 'Prompt',
  '/inbox': 'Posta in Arrivo',
  '/calendar': 'Calendario',
  '/taxonomy': 'Tassonomia',
  '/settings': 'Impostazioni',
};

export default function AppHeader() {
  const location = useLocation();
  const { token } = antdTheme.useToken();

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    // Check for exact match first
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Check for prefix match (e.g. /prompts/123 -> Prompts)
    const basePath = '/' + path.split('/').filter(Boolean)[0];
    if (PAGE_TITLES[basePath]) return PAGE_TITLES[basePath];

    // Special cases
    if (path.startsWith('/articles/')) return 'Dettaglio Articolo';

    return 'Global Shopping Insights';
  }, [location.pathname]);

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: token.colorBgContainer,
        padding: '0 24px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Title level={4} style={{ margin: 0, color: token.colorText }}>
        {pageTitle}
      </Title>

      <Space size="small">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </Space>
    </Header>
  );
}
