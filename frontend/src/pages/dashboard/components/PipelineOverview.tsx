// ---------------------------------------------------------------------------
// PipelineOverview.tsx — row di stages pipeline (stile "stepper" visivo)
// ---------------------------------------------------------------------------
// Sprint 7 polish: refresh grafico con tokens dark-mode-aware + icona Lucide
// ChevronRight + hover subtle animato. Per la visualizzazione dati-dense
// (funnel con counts), vedi il nuovo componente PipelineFunnel in DashboardPage.
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';

import { theme as antdTheme, Tooltip, Typography } from 'antd';
import { ChevronRight } from 'lucide-react';

import StatusBadge from '@/components/common/StatusBadge';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';

const { Text } = Typography;

interface PipelineOverviewProps {
  byStatus: Record<string, number>;
}

const PIPELINE_STAGES: ArticleStatus[] = [
  'imported',
  'screened',
  'in_review',
  'approved',
  'scheduled',
  'published',
];

export default function PipelineOverview({ byStatus }: PipelineOverviewProps) {
  const { token } = antdTheme.useToken();

  const containerStyle: CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    padding: '20px 24px',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div style={containerStyle}>
      <Text
        strong
        style={{
          fontSize: 14,
          color: token.colorTextSecondary,
          display: 'block',
          marginBottom: 16,
        }}
      >
        Pipeline Editoriale
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.map((status, i) => {
          const meta = STATUS_MAP[status];
          const count = byStatus[status] ?? 0;
          return (
            <div
              key={status}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 120px',
                minWidth: 120,
              }}
            >
              <Tooltip title={`${meta.label}: ${count} articoli`}>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px 8px',
                    borderRadius: 8,
                    cursor: 'default',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${meta.color}14`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: meta.color,
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {count}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                    <StatusBadge status={status} size="sm" />
                  </div>
                </div>
              </Tooltip>
              {i < PIPELINE_STAGES.length - 1 && (
                <ChevronRight
                  size={16}
                  color={token.colorBorderSecondary}
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
