import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

const { Title } = Typography;

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 32,
        }}
      >
        <GlobalOutlined style={{ fontSize: 40, color: '#1677ff' }} />
        <Title level={2} style={{ margin: 0 }}>
          Global Shopping Insights
        </Title>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 32,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
        }}
      >
        <Suspense
          fallback={<Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
