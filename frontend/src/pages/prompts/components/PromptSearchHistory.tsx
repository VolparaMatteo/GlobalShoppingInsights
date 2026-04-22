// ---------------------------------------------------------------------------
// PromptSearchHistory.tsx  --  Table of past search runs for a prompt
// ---------------------------------------------------------------------------
import { useState, useMemo, useCallback } from 'react';
import { Badge, Descriptions, Drawer, Skeleton, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getSearchRun } from '@/services/api/search.api';
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
  /** Run "leggera" dalla lista parent (senza `results`). Usata per header mentre il detail carica. */
  run: SearchRun | null;
  open: boolean;
  onClose: () => void;
}

function ResultsDrawer({ run, open, onClose }: ResultsDrawerProps) {
  // IMPORTANTE: la lista `searchRuns` non include `results` (solo il detail
  // endpoint `GET /search-runs/:id` li popola). Qui rifacciamo la fetch del
  // detail all'apertura del drawer.
  const { data: runDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['searchRunDetail', run?.id],
    queryFn: () => getSearchRun(run!.id),
    enabled: open && !!run,
  });

  if (!run) return null;

  // Preferisce sempre il detail fresco; fallback al record leggero finché la
  // query non risponde (lo header statistico è identico nei due shape).
  const displayRun = runDetail ?? run;

  const resultColumns: ColumnsType<SearchResult> = [
    {
      title: 'Articolo',
      key: 'article',
      ellipsis: true,
      render: (_: unknown, record: SearchResult) => (
        <Link
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 500 }}
        >
          {record.title || record.url}
        </Link>
      ),
    },
    {
      title: 'Dominio',
      dataIndex: 'domain',
      key: 'domain',
      width: 180,
      ellipsis: true,
      render: (val: string | null) =>
        val ? <Text style={{ fontSize: 12 }}>{val}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Score',
      dataIndex: 'article_score',
      key: 'article_score',
      width: 90,
      align: 'center' as const,
      render: (score: number | null) => {
        if (score == null) return <Text type="secondary">—</Text>;
        const color = score >= 70 ? 'green' : score >= 40 ? 'orange' : 'red';
        return <Tag color={color}>{score}</Tag>;
      },
    },
  ];

  return (
    <Drawer
      title={`Esecuzione #${displayRun.id} — Risultati`}
      placement="right"
      width={800}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {/* Run summary */}
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Stato">{getStatusBadge(displayRun.status)}</Descriptions.Item>
        <Descriptions.Item label="Avvio">
          {dayjs(displayRun.started_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="Fine">
          {displayRun.ended_at ? dayjs(displayRun.ended_at).format('YYYY-MM-DD HH:mm:ss') : '--'}
        </Descriptions.Item>
        <Descriptions.Item label="URL Trovati">{displayRun.urls_found}</Descriptions.Item>
        <Descriptions.Item label="Articoli Creati">{displayRun.articles_created}</Descriptions.Item>
        <Descriptions.Item label="Duplicati Ignorati">
          {displayRun.duplicates_skipped}
        </Descriptions.Item>
        <Descriptions.Item label="Filtrati per Lingua">
          {displayRun.language_filtered > 0 ? (
            <Text type="warning">{displayRun.language_filtered}</Text>
          ) : (
            '0'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Filtrati per Data">
          {displayRun.date_filtered > 0 ? (
            <Text type="warning">{displayRun.date_filtered}</Text>
          ) : (
            '0'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Filtrati per Rilevanza">
          {displayRun.relevance_filtered > 0 ? (
            <Text type="warning">{displayRun.relevance_filtered}</Text>
          ) : (
            '0'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Errori">
          {displayRun.errors_count > 0 ? (
            <Text type="danger">
              {displayRun.errors_count}
              {displayRun.error_message ? ` - ${displayRun.error_message}` : ''}
            </Text>
          ) : (
            '0'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Results table */}
      <Title level={5} style={{ marginBottom: 12 }}>
        Risultati ({detailLoading ? '…' : (runDetail?.results?.length ?? 0)})
      </Title>

      {detailLoading && !runDetail ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Table<SearchResult>
          rowKey="id"
          columns={resultColumns}
          dataSource={runDetail?.results ?? []}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="small"
          scroll={{ x: 700 }}
        />
      )}
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
