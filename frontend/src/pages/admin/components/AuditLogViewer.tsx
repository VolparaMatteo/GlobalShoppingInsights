import React, { useState } from 'react';
import { Table, Select, DatePicker, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getAuditLogs } from '@/services/api/audit.api';
import type { GetAuditLogsParams } from '@/services/api/audit.api';
import { formatDateTime } from '@/utils/date';
import type { AuditLog } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/** Query key for audit logs (not in the global factory; local to this view). */
const AUDIT_KEY = [...queryKeys.settings.all, 'audit'] as const;

/** Common audit action types for filtering. */
const ACTION_OPTIONS = [
  { label: 'All Actions', value: '' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Login', value: 'login' },
  { label: 'Publish', value: 'publish' },
  { label: 'Sync', value: 'sync' },
];

export default function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // ---- Build query params -------------------------------------------------

  const params: GetAuditLogsParams = {
    page,
    page_size: pageSize,
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(dateRange?.[0] ? { from: dateRange[0].startOf('day').toISOString() } : {}),
    ...(dateRange?.[1] ? { to: dateRange[1].endOf('day').toISOString() } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: [...AUDIT_KEY, params],
    queryFn: () => getAuditLogs(params),
  });

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (val: string) => formatDateTime(val),
      sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'User',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (val: number | null) => (val !== null ? `#${val}` : '-'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
      width: 120,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entity_id',
      key: 'entity_id',
      width: 100,
      render: (val: number | null) => (val !== null ? val : '-'),
    },
  ];

  // ---- Expandable row for metadata ----------------------------------------

  function expandedRowRender(record: AuditLog) {
    if (!record.metadata || Object.keys(record.metadata).length === 0) {
      return <Typography.Text type="secondary">No additional metadata.</Typography.Text>;
    }

    return (
      <pre
        style={{
          margin: 0,
          padding: 12,
          background: '#fafafa',
          borderRadius: 4,
          fontSize: 12,
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        {JSON.stringify(record.metadata, null, 2)}
      </pre>
    );
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={actionFilter}
          onChange={setActionFilter}
          options={ACTION_OPTIONS}
          style={{ width: 160 }}
          placeholder="Filter by action"
        />
        <RangePicker
          onChange={(dates) =>
            setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
          }
          allowClear
        />
      </Space>

      <Table<AuditLog>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) =>
            !!record.metadata && Object.keys(record.metadata).length > 0,
        }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
}
