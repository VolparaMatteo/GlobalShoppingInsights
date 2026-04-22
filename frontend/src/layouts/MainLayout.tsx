import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import AppSider from '@/layouts/components/AppSider';
import AppHeader from '@/layouts/components/AppHeader';
import LLMStatusBanner from '@/components/common/LLMStatusBanner';
import PageTransition from '@/components/common/PageTransition';
import ShortcutsCheatsheet from '@/components/common/ShortcutsCheatsheet';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useUiStore } from '@/stores/uiStore';

const { Content } = Layout;

export default function MainLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleTheme = useUiStore((s) => s.toggleThemeMode);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  // Global shortcuts (il mod+k per command palette e' gestito da
  // HeaderSearchButton, che possiede lo stato + il mount del modal).
  useKeyboardShortcut('?', () => setCheatsheetOpen(true));
  useKeyboardShortcut('mod+shift+l', () => toggleTheme());

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSider collapsed={collapsed} />
      <Layout>
        <AppHeader />
        <Content
          style={{
            margin: 24,
            padding: 0,
            overflow: 'auto',
          }}
        >
          <LLMStatusBanner />
          <Suspense
            fallback={<Spin size="large" style={{ display: 'block', margin: '20% auto' }} />}
          >
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>

          <ShortcutsCheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
        </Content>
      </Layout>
    </Layout>
  );
}
