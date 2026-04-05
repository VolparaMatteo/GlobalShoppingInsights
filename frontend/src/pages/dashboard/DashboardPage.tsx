// ---------------------------------------------------------------------------
// DashboardPage.tsx  --  Main dashboard with KPIs, pipeline, jobs & alerts
// ---------------------------------------------------------------------------
import { Row, Col, Typography, Skeleton } from 'antd';
import KPICards from './components/KPICards';
import RecentJobsList from './components/RecentJobsList';
import AlertsList from './components/AlertsList';
import PipelineOverview from './components/PipelineOverview';
import { useDashboardKPIs } from '@/hooks/queries/useDashboardKPIs';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { data: kpis, isLoading, isError } = useDashboardKPIs();
  const userName = useAuthStore((s) => s.user?.name);

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* --- Welcome Header --- */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          {greeting()}, {userName || 'there'}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Ecco lo stato della tua pipeline editoriale oggi.
        </Text>
      </div>

      {/* --- KPI Cards --- */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <Skeleton.Node active style={{ width: '100%', height: 120, borderRadius: 12 }} />
            </Col>
          ))}
        </Row>
      ) : (
        <KPICards kpis={kpis ?? null} isError={isError} />
      )}

      {/* --- Pipeline Overview --- */}
      <div style={{ marginTop: 28 }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          kpis && <PipelineOverview byStatus={kpis.by_status} />
        )}
      </div>

      {/* --- Jobs & Alerts --- */}
      <Row gutter={[24, 24]} style={{ marginTop: 28 }}>
        <Col xs={24} lg={14}>
          <RecentJobsList />
        </Col>
        <Col xs={24} lg={10}>
          <AlertsList />
        </Col>
      </Row>
    </div>
  );
}
