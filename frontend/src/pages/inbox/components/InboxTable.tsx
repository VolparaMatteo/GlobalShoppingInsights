// ---------------------------------------------------------------------------
// InboxTable  --  Ant Design Table for the article inbox list
// ---------------------------------------------------------------------------
import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';

import type { Article } from '@/types';
import StatusBadge from '@/pages/inbox/components/StatusBadge';
import ScoreBadge from '@/pages/inbox/components/ScoreBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InboxTablePagination {
  current: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

interface InboxTableProps {
  articles: Article[];
  loading: boolean;
  pagination: InboxTablePagination;
  selectedRowKeys: React.Key[];
  onSelectChange: (keys: React.Key[]) => void;
  onSort: (sort: SortState | null) => void;
  onRowClick?: (article: Article) => void;
  onPaginationChange?: (page: number, pageSize: number) => void;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnsType<Article> = [
  {
    title: 'Titolo',
    dataIndex: 'title',
    key: 'title',
    sorter: true,
    ellipsis: true,
    width: '30%',
    render: (title: string) => (
      <Typography.Text strong ellipsis style={{ maxWidth: '100%' }}>
        {title}
      </Typography.Text>
    ),
  },
  {
    title: 'Fonte',
    dataIndex: 'source_domain',
    key: 'source_domain',
    sorter: true,
    width: 160,
    ellipsis: true,
  },
  {
    title: 'Lingua',
    dataIndex: 'language',
    key: 'language',
    sorter: true,
    width: 100,
    render: (lang: string) => lang?.toUpperCase() ?? '—',
  },
  {
    title: 'Stato',
    dataIndex: 'status',
    key: 'status',
    sorter: true,
    width: 130,
    render: (status: string) => <StatusBadge status={status} />,
  },
  {
    title: 'Punteggio AI',
    dataIndex: 'ai_score',
    key: 'ai_score',
    sorter: true,
    width: 110,
    align: 'center',
    render: (score: number | null) => <ScoreBadge score={score} />,
  },
  {
    title: 'Pubblicato',
    dataIndex: 'published_at',
    key: 'published_at',
    sorter: true,
    width: 140,
    render: (date: string | null) =>
      date ? dayjs(date).format('DD/MM/YY') : '—',
  },
  {
    title: 'Importato',
    dataIndex: 'created_at',
    key: 'created_at',
    sorter: true,
    width: 110,
    render: (date: string) => dayjs(date).format('DD/MM/YY'),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InboxTable({
  articles,
  loading,
  pagination,
  selectedRowKeys,
  onSelectChange,
  onSort,
  onRowClick,
  onPaginationChange,
}: InboxTableProps) {
  const handleTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Article> | SorterResult<Article>[],
  ) => {
    // Pagination
    if (onPaginationChange && pag.current && pag.pageSize) {
      onPaginationChange(pag.current, pag.pageSize);
    }

    // Sorting -- only handle single-column sort
    if (!Array.isArray(sorter) && sorter.field && sorter.order) {
      onSort({
        field: sorter.field as string,
        order: sorter.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      onSort(null);
    }
  };

  return (
    <Table<Article>
      rowKey="id"
      dataSource={articles}
      columns={columns}
      loading={loading}
      size="middle"
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectChange(keys),
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} di ${total} articoli`,
      }}
      onChange={handleTableChange as never}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : undefined },
      })}
      scroll={{ x: 900 }}
    />
  );
}
