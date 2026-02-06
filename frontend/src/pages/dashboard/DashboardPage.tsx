// ---------------------------------------------------------------------------
// DashboardPage.tsx  --  Main dashboard with KPIs, recent jobs, and alerts
// ---------------------------------------------------------------------------
import { Row, Col } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import KPICards from './components/KPICards';
import RecentJobsList from './components/RecentJobsList';
import AlertsList from './components/AlertsList';
import { useDashboardKPIs } from '@/hooks/queries/useDashboardKPIs';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { data: kpis, isLoading, isError } = useDashboardKPIs();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your editorial pipeline" />

      {isLoading ? (
        <LoadingSpinner tip="Loading dashboard..." />
      ) : (
        <>
          <KPICards kpis={kpis ?? null} isError={isError} />

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <RecentJobsList />
            </Col>
            <Col xs={24} lg={12}>
              <AlertsList />
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
