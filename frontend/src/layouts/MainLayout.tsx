import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import AppSider from '@/layouts/components/AppSider';
import AppHeader from '@/layouts/components/AppHeader';
import LLMStatusBanner from '@/components/common/LLMStatusBanner';
import PageTransition from '@/components/common/PageTransition';
import { useUiStore } from '@/stores/uiStore';

const { Content } = Layout;

export default function MainLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

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
        </Content>
      </Layout>
    </Layout>
  );
}
