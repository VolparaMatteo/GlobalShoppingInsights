// ---------------------------------------------------------------------------
// AlertsPage — Sprint 7 polish b12 (premium hero + card layout + Lucide badges)
// Storico paginato di job_logs con filtri per severità / tipo.
// ---------------------------------------------------------------------------
import { useState } from 'react';

import { Button, Select, Space, Table, Tooltip, Typography, theme as antdTheme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Loader,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import EmptyState from '@/components/common/EmptyState';
import RelativeTime from '@/components/common/RelativeTime';
import { useJobLogs } from '@/hooks/queries/useJobLogs';
import type { JobLog } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { label: 'Tutti', value: '' },
  { label: 'In corso', value: 'running' },
  { label: 'In attesa', value: 'pending' },
  { label: 'Completati', value: 'completed' },
  { label: 'Falliti', value: 'failed' },
];

const JOB_TYPE_OPTIONS = [
  { label: 'Tutti', value: '' },
  { label: 'Discovery', value: 'discovery' },
  { label: 'Publish', value: 'publish' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const { token } = antdTheme.useToken();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');

  const { data, isLoading, isFetching, refetch } = useJobLogs({
    page,
    page_size: pageSize,
    status: statusFilter || undefined,
    job_type: jobTypeFilter || undefined,
  });

  const columns: ColumnsType<JobLog> = [
    {
      title: 'Iniziato',
      dataIndex: 'started_at',
      width: 170,
      render: (ts: string | null) =>
        ts ? (
          <RelativeTime date={ts} />
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>
            —
          </Text>
        ),
    },
    {
      title: 'Tipo',
      dataIndex: 'job_type',
      width: 130,
      render: (t: string) => <JobTypePill type={t} />,
    },
    {
      title: 'Riferimento',
      dataIndex: 'entity_ref',
      ellipsis: true,
      render: (r: string | null) =>
        r ? (
          <Text
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: 12,
            }}
          >
            {r}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Stato',
      dataIndex: 'status',
      width: 150,
      render: (s: string) => <StatusPill status={s} />,
    },
    {
      title: 'Progresso',
      dataIndex: 'progress',
      width: 140,
      render: (p: number | null) =>
        p !== null ? (
          <ProgressBar value={p} />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    {
      title: 'Errore',
      dataIndex: 'error',
      ellipsis: true,
      render: (e: string | null) =>
        e ? (
          <Tooltip title={e}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: token.colorError,
                fontSize: 12,
                maxWidth: 380,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.2} />
              {e}
            </span>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title
            level={3}
            style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: token.colorText }}
          >
            Alert & log dei job
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Storico delle esecuzioni dello scheduler (discovery, publish). Filtra per stato o tipo.
          </Text>
        </div>
        <Button
          icon={<RefreshCw size={14} />}
          onClick={() => refetch()}
          loading={isFetching}
          style={{ height: 40, borderRadius: 10, fontWeight: 500, padding: '0 16px' }}
        >
          Aggiorna
        </Button>
      </div>

      {/* Main card */}
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Filter row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: token.colorTextTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            <Filter size={13} />
            Filtri
          </span>

          <Space size={8}>
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
              style={{ width: 170 }}
              placeholder="Stato"
            />
            <Select
              value={jobTypeFilter}
              onChange={(v) => {
                setJobTypeFilter(v);
                setPage(1);
              }}
              options={JOB_TYPE_OPTIONS}
              style={{ width: 170 }}
              placeholder="Tipo"
            />
          </Space>

          <div style={{ flex: 1 }} />

          {data && (
            <Text type="secondary" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {data.total} {data.total === 1 ? 'job' : 'job totali'}
            </Text>
          )}
        </div>

        {!isLoading && data && data.items.length === 0 ? (
          <EmptyState description="Nessun job trovato con i filtri selezionati" />
        ) : (
          <Table<JobLog>
            columns={columns}
            dataSource={data?.items ?? []}
            rowKey="id"
            loading={isLoading}
            size="middle"
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} di ${total}`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 900 }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusPill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: string }) {
  const { token } = antdTheme.useToken();

  const config: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
    pending: {
      label: 'In attesa',
      color: token.colorTextSecondary,
      bg: token.colorFillQuaternary,
      Icon: Clock,
    },
    running: {
      label: 'In corso',
      color: token.colorPrimary,
      bg: `${token.colorPrimary}14`,
      Icon: Loader,
    },
    completed: {
      label: 'Completato',
      color: token.colorSuccess,
      bg: `${token.colorSuccess}14`,
      Icon: CheckCircle2,
    },
    failed: {
      label: 'Fallito',
      color: token.colorError,
      bg: `${token.colorError}14`,
      Icon: XCircle,
    },
  };

  const c = config[status] ?? {
    label: status,
    color: token.colorTextSecondary,
    bg: token.colorFillQuaternary,
    Icon: Clock,
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 500,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}33`,
        borderRadius: 6,
        lineHeight: 1,
      }}
    >
      <c.Icon
        size={11}
        strokeWidth={2.4}
        style={status === 'running' ? { animation: 'gsi-spin 1s linear infinite' } : undefined}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// JobTypePill
// ---------------------------------------------------------------------------

function JobTypePill({ type }: { type: string }) {
  const { token } = antdTheme.useToken();

  // Tint per tipo: discovery=blu, publish=purple, altri=neutro
  const tint =
    type === 'discovery'
      ? { color: '#1677ff', bg: 'rgba(22,119,255,0.1)' }
      : type === 'publish'
        ? { color: '#722ed1', bg: 'rgba(114,46,209,0.1)' }
        : { color: token.colorTextSecondary, bg: token.colorFillQuaternary };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 500,
        color: tint.color,
        background: tint.bg,
        border: `1px solid ${tint.color}33`,
        borderRadius: 6,
        lineHeight: 1,
        textTransform: 'capitalize',
      }}
    >
      {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

function ProgressBar({ value }: { value: number }) {
  const { token } = antdTheme.useToken();
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: token.colorFillQuaternary,
          overflow: 'hidden',
          minWidth: 48,
        }}
      >
        <div
          style={{
            width: `${safe}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1677ff 0%, #722ed1 100%)',
            borderRadius: 3,
            transition: 'width 400ms ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: token.colorTextSecondary,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
          textAlign: 'right',
        }}
      >
        {safe}%
      </span>
    </div>
  );
}
