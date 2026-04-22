// ---------------------------------------------------------------------------
// AlertsPage — storico paginato di job_logs con filtri per severità / tipo.
// Sprint 4 batch 4.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Card, Table, Tag, Select, Space, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';

import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import RelativeTime from '@/components/common/RelativeTime';
import { useJobLogs } from '@/hooks/queries/useJobLogs';
import type { JobLog } from '@/types';

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

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'In attesa',
  running: 'In corso',
  completed: 'Completato',
  failed: 'Fallito',
};

export default function AlertsPage() {
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
      width: 160,
      render: (ts: string | null) =>
        ts ? <RelativeTime date={ts} /> : <span style={{ opacity: 0.6 }}>—</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'job_type',
      width: 120,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Riferimento',
      dataIndex: 'entity_ref',
      ellipsis: true,
      render: (r: string | null) => r || <span style={{ opacity: 0.6 }}>—</span>,
    },
    {
      title: 'Stato',
      dataIndex: 'status',
      width: 140,
      render: (s: string) => (
        <Tag color={STATUS_COLORS[s] ?? 'default'}>{STATUS_LABELS[s] ?? s}</Tag>
      ),
    },
    {
      title: 'Progresso',
      dataIndex: 'progress',
      width: 100,
      align: 'right',
      render: (p: number | null) => (p !== null ? `${p}%` : '—'),
    },
    {
      title: 'Errore',
      dataIndex: 'error',
      ellipsis: true,
      render: (e: string | null) =>
        e ? (
          <Typography.Text type="danger" ellipsis style={{ maxWidth: 400 }}>
            {e}
          </Typography.Text>
        ) : (
          <span style={{ opacity: 0.6 }}>—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Alert & log dei job"
        subtitle="Storico completo delle esecuzioni dello scheduler (discovery, publish). Filtra per stato o tipo."
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Space>
            <span>Stato:</span>
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
              style={{ width: 160 }}
            />
          </Space>
          <Space>
            <span>Tipo:</span>
            <Select
              value={jobTypeFilter}
              onChange={(v) => {
                setJobTypeFilter(v);
                setPage(1);
              }}
              options={JOB_TYPE_OPTIONS}
              style={{ width: 160 }}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Aggiorna
          </Button>
        </Space>
      </Card>

      <Card>
        {!isLoading && data && data.items.length === 0 ? (
          <EmptyState description="Nessun job trovato con i filtri selezionati" />
        ) : (
          <Table<JobLog>
            columns={columns}
            dataSource={data?.items ?? []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>
    </div>
  );
}
