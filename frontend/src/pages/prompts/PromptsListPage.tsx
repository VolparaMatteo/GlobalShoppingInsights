// ---------------------------------------------------------------------------
// PromptsListPage.tsx  --  Paginated table listing all search prompts
// ---------------------------------------------------------------------------
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { getPrompts } from '@/services/api/prompts.api';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/config/constants';
import type { Prompt } from '@/types';

const { Title } = Typography;

// ---------------------------------------------------------------------------
// Hook: usePrompts
// ---------------------------------------------------------------------------

function usePrompts(params: { page: number; pageSize: number; search: string }) {
  return useQuery({
    queryKey: ['prompts', params.page, params.pageSize, params.search],
    queryFn: () =>
      getPrompts({
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
      }),
    placeholderData: (prev) => prev,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PromptsListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');

  const { data, isLoading } = usePrompts({ page, pageSize, search });

  // ---- Columns -----------------------------------------------------------

  const columns: ColumnsType<Prompt> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: 'Keywords',
        dataIndex: 'keywords',
        key: 'keywords',
        render: (keywords: string[]) => (
          <Space size={[0, 4]} wrap>
            {keywords.slice(0, 5).map((kw) => (
              <Tag key={kw} color="blue">
                {kw}
              </Tag>
            ))}
            {keywords.length > 5 && (
              <Tag>+{keywords.length - 5}</Tag>
            )}
          </Space>
        ),
      },
      {
        title: 'Language',
        dataIndex: 'language',
        key: 'language',
        width: 100,
        render: (lang: string | null) => lang ?? '--',
      },
      {
        title: 'Time Depth',
        dataIndex: 'time_depth',
        key: 'time_depth',
        width: 120,
      },
      {
        title: 'Schedule',
        key: 'schedule',
        width: 110,
        render: (_: unknown, record: Prompt) =>
          record.schedule_enabled ? (
            <Tag color="green">Enabled</Tag>
          ) : (
            <Tag>Disabled</Tag>
          ),
      },
      {
        title: 'Last Run',
        key: 'last_run',
        width: 170,
        render: (_: unknown, record: Prompt) =>
          record.schedule_next_run_at
            ? dayjs(record.schedule_next_run_at).format('YYYY-MM-DD HH:mm')
            : '--',
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_: unknown, record: Prompt) => (
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/prompts/${record.id}`);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  // ---- Pagination config -------------------------------------------------

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total: data?.total ?? 0,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} prompts`,
    onChange: (newPage, newPageSize) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
  };

  // ---- Render ------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Search Prompts
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/prompts/new')}
        >
          New Prompt
        </Button>
      </div>

      {/* Search bar */}
      <Input
        placeholder="Search prompts by title or keyword..."
        prefix={<SearchOutlined />}
        allowClear
        style={{ maxWidth: 400, marginBottom: 16 }}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Table */}
      <Table<Prompt>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={pagination}
        onRow={(record) => ({
          onClick: () => navigate(`/prompts/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
