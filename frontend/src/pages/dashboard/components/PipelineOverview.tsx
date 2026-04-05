// ---------------------------------------------------------------------------
// PipelineOverview.tsx  --  Visual workflow pipeline bar for the dashboard
// ---------------------------------------------------------------------------
import { Tooltip, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';
import type { CSSProperties } from 'react';

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

const containerStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.06)',
  background: '#fff',
  padding: '20px 24px',
};

const stageStyle = (color: string, bgColor: string, isHovered: boolean): CSSProperties => ({
  flex: 1,
  textAlign: 'center',
  padding: '12px 8px',
  borderRadius: 8,
  background: isHovered ? bgColor : 'transparent',
  transition: 'background 0.2s ease',
  cursor: 'default',
});

export default function PipelineOverview({ byStatus }: PipelineOverviewProps) {
  return (
    <div style={containerStyle}>
      <Text strong style={{ fontSize: 14, color: '#595959', display: 'block', marginBottom: 16 }}>
        Pipeline Editoriale
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {PIPELINE_STAGES.map((status, i) => {
          const meta = STATUS_MAP[status];
          const count = byStatus[status] ?? 0;
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Tooltip title={`${meta.label}: ${count} articoli`}>
                <div
                  style={stageStyle(meta.color, meta.bgColor, false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = meta.bgColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: meta.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#8c8c8c',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {meta.label}
                  </div>
                </div>
              </Tooltip>
              {i < PIPELINE_STAGES.length - 1 && (
                <RightOutlined style={{ color: '#d9d9d9', fontSize: 10, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
