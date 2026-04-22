// ---------------------------------------------------------------------------
// PromptSearchHistory.tsx  --  Table of past search runs for a prompt
// ---------------------------------------------------------------------------
import { useState, useMemo, useCallback } from 'react';
import { Badge, Descriptions, Drawer, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import type { SearchRun, SearchResult } from '@/types';

const { Title, Text, Link } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RunStatus = 'running' | 'completed' | 'failed' | 'queued';

const STATUS_BADGE: Record<
  RunStatus,
  { status: 'processing' | 'success' | 'error' | 'default'; text: string }
> = {
  running: { status: 'processing', text: 'In Esecuzione' },
  completed: { status: 'success', text: 'Completata' },
  failed: { status: 'error', text: 'Fallita' },
  queued: { status: 'default', text: 'In Coda' },
};

function getStatusBadge(status: string) {
  const entry = STATUS_BADGE[status as RunStatus] ?? {
    status: 'default' as const,
    text: status,
  };
  return <Badge status={entry.status} text={entry.text} />;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptSearchHistoryProps {
  promptId: number;
  searchRuns: SearchRun[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-component: results drawer
// ---------------------------------------------------------------------------

interface ResultsDrawerProps {
  run: SearchRun | null;
  open: boolean;
  onClose: () => void;
}

function ResultsDrawer({ run, open, onClose }: ResultsDrawerProps) {
  if (!run) return null;

  const resultColumns: ColumnsType<SearchResult> = [
    {
      title: 'Titolo',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string | null, record: SearchResult) =>
        text ? (
          <Link href={record.url} target="_blank" rel="noopener noreferrer">
            {text}
          </Link>
        ) : (
          <Link href={record.url} target="_blank" rel="noopener noreferrer">
            {record.url}
          </Link>
        ),
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
    },
    {
      title: 'Dominio',
      dataIndex: 'domain',
      key: 'domain',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Pubblicato',
      dataIndex: 'published_at_est',
      key: 'published_at_est',
      width: 150,
      render: (val: string | null) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '--'),
    },
    {
      title: 'Articolo',
      dataIndex: 'article_id',
      key: 'article_id',
      width: 80,
      render: (val: number | null) => (val ? <Tag color="green">#{val}</Tag> : <Tag>--</Tag>),
    },
  ];

  return (
    <Drawer
      title={`Esecuzione #${run.id} — Risultati`}
      placement="right"
      width={800}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {/* Run summary */}
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Stato">{getStatusBadge(run.status)}</Descriptions.Item>
        <Descriptions.Item label="Avvio">
          {dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="Fine">
          {run.ended_at ? dayjs(run.ended_at).format('YYYY-MM-DD HH:mm:ss') : '--'}
        </Descriptions.Item>
        <Descriptions.Item label="URL Trovati">{run.urls_found}</Descriptions.Item>
        <Descriptions.Item label="Articoli Creati">{run.articles_created}</Descriptions.Item>
        <Descriptions.Item label="Duplicati Ignorati">{run.duplicates_skipped}</Descriptions.Item>
        <Descriptions.Item label="Filtrati per Lingua">
          {run.language_filtered > 0 ? <Text type="warning">{run.language_filtered}</Text> : '0'}
        </Descriptions.Item>
        <Descriptions.Item label="Filtrati per Data">
          {run.date_filtered > 0 ? <Text type="warning">{run.date_filtered}</Text> : '0'}
        </Descriptions.Item>
        <Descriptions.Item label="Filtrati per Rilevanza">
          {run.relevance_filtered > 0 ? <Text type="warning">{run.relevance_filtered}</Text> : '0'}
        </Descriptions.Item>
        <Descriptions.Item label="Errori">
          {run.errors_count > 0 ? (
            <Text type="danger">
              {run.errors_count}
              {run.error_message ? ` - ${run.error_message}` : ''}
            </Text>
          ) : (
            '0'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Results table */}
      <Title level={5} style={{ marginBottom: 12 }}>
        Risultati ({run.results?.length ?? 0})
      </Title>

      <Table<SearchResult>
        rowKey="id"
        columns={resultColumns}
        dataSource={run.results ?? []}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="small"
        scroll={{ x: 700 }}
      />
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PromptSearchHistory({
  promptId,
  searchRuns,
  loading = false,
}: PromptSearchHistoryProps) {
  const [selectedRun, setSelectedRun] = useState<SearchRun | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = useCallback((run: SearchRun) => {
    setSelectedRun(run);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // ---- Columns -----------------------------------------------------------

  const columns: ColumnsType<SearchRun> = useMemo(
    () => [
      {
        title: 'Avvio',
        dataIndex: 'started_at',
        key: 'started_at',
        width: 180,
        render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
        defaultSortOrder: 'descend' as const,
        sorter: (a: SearchRun, b: SearchRun) =>
          dayjs(a.started_at).unix() - dayjs(b.started_at).unix(),
      },
      {
        title: 'Stato',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status: string) => getStatusBadge(status),
      },
      {
        title: 'URL Trovati',
        dataIndex: 'urls_found',
        key: 'urls_found',
        width: 110,
        align: 'right' as const,
      },
      {
        title: 'Articoli Creati',
        dataIndex: 'articles_created',
        key: 'articles_created',
        width: 140,
        align: 'right' as const,
      },
      {
        title: 'Duplicati',
        dataIndex: 'duplicates_skipped',
        key: 'duplicates_skipped',
        width: 110,
        align: 'right' as const,
      },
      {
        title: 'Filtro Lingua',
        dataIndex: 'language_filtered',
        key: 'language_filtered',
        width: 120,
        align: 'right' as const,
        render: (count: number) =>
          count > 0 ? <Text type="warning">{count}</Text> : <Text type="secondary">0</Text>,
      },
      {
        title: 'Filtro Data',
        dataIndex: 'date_filtered',
        key: 'date_filtered',
        width: 110,
        align: 'right' as const,
        render: (count: number) =>
          count > 0 ? <Text type="warning">{count}</Text> : <Text type="secondary">0</Text>,
      },
      {
        title: 'Non Rilevanti',
        dataIndex: 'relevance_filtered',
        key: 'relevance_filtered',
        width: 120,
        align: 'right' as const,
        render: (count: number) =>
          count > 0 ? <Text type="warning">{count}</Text> : <Text type="secondary">0</Text>,
      },
      {
        title: 'Errori',
        dataIndex: 'errors_count',
        key: 'errors_count',
        width: 90,
        align: 'right' as const,
        render: (count: number) =>
          count > 0 ? <Text type="danger">{count}</Text> : <Text type="secondary">0</Text>,
      },
    ],
    [],
  );

  // ---- Render -------------------------------------------------------------

  return (
    <>
      <Table<SearchRun>
        rowKey="id"
        columns={columns}
        dataSource={searchRuns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 750 }}
        locale={{ emptyText: 'Nessuna esecuzione di ricerca per questo prompt' }}
      />

      <ResultsDrawer run={selectedRun} open={drawerOpen} onClose={handleDrawerClose} />
    </>
  );
}
