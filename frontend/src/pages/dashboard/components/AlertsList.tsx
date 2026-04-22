// ---------------------------------------------------------------------------
// AlertsList.tsx  --  Modern dashboard alerts / warnings feed
// ---------------------------------------------------------------------------
import { Typography } from 'antd';
import { InfoCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';
import { useDashboardAlerts } from '@/hooks/queries/useDashboardKPIs';
import RelativeTime from '@/components/common/RelativeTime';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { DashboardAlert } from '@/services/api/dashboard.api';
import type { CSSProperties } from 'react';

const { Text } = Typography;

const LEVEL_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
  error: {
    icon: <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />,
    bg: '#fff2f0',
    border: '#ffccc7',
  },
  warning: {
    icon: <WarningFilled style={{ color: '#faad14', fontSize: 16 }} />,
    bg: '#fffbe6',
    border: '#ffe58f',
  },
  info: {
    icon: <InfoCircleFilled style={{ color: '#1677ff', fontSize: 16 }} />,
    bg: '#e6f4ff',
    border: '#91caff',
  },
};

const containerStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.06)',
  background: '#fff',
  padding: '20px 24px',
  height: '100%',
};

const alertItemStyle = (level: DashboardAlert['level']): CSSProperties => {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    background: config.bg,
    border: `1px solid ${config.border}`,
    marginBottom: 8,
  };
};

export default function AlertsList() {
  const { data: alerts, isLoading, isError } = useDashboardAlerts();

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Text strong style={{ fontSize: 14, color: '#595959' }}>
          Avvisi
        </Text>
        {alerts && alerts.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#ff4d4f',
              background: '#fff2f0',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {isLoading && <LoadingSpinner size="small" tip="Caricamento avvisi..." />}
      {isError && <EmptyState description="Impossibile caricare gli avvisi" />}

      {!isLoading && !isError && (
        <>
          {!alerts?.length ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 0',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>
                <CheckIcon />
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Tutto in ordine! Nessun avviso attivo.
              </Text>
            </div>
          ) : (
            alerts.map((alert) => {
              const config = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
              return (
                <div key={alert.id} style={alertItemStyle(alert.level)}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{config.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, lineHeight: 1.4 }}>{alert.message}</Text>
                    {alert.timestamp && (
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                        <RelativeTime date={alert.timestamp} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#52c41a"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
