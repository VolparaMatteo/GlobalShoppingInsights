// ---------------------------------------------------------------------------
// InboxPage — Sprint 7 polish b10 (premium hero + card layout + floating bulk)
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from 'react';

import { theme as antdTheme, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import ExportButton from '@/components/common/ExportButton';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import { queryKeys } from '@/config/queryKeys';
import { useToast } from '@/hooks/useToast';
import ArticlePreviewDrawer from '@/pages/inbox/components/ArticlePreviewDrawer';
import BatchActionsBar, { type BatchActionPayload } from '@/pages/inbox/components/BatchActionsBar';
import InboxFilters, {
  DEFAULT_FILTERS,
  type InboxFilterValues,
} from '@/pages/inbox/components/InboxFilters';
import InboxTable, {
  type InboxTablePagination,
  type SortState,
} from '@/pages/inbox/components/InboxTable';
import {
  batchAction,
  changeStatus,
  getArticles,
  type GetArticlesParams,
} from '@/services/api/articles.api';
import type { Article } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filtersToParams(
  filters: InboxFilterValues,
  pagination: InboxTablePagination,
  sort: SortState | null,
): GetArticlesParams {
  const params: GetArticlesParams = {
    page: pagination.current,
    page_size: pagination.pageSize,
  };

  if (filters.search) params.search = filters.search;
  if (filters.statuses.length > 0) params.status = filters.statuses.join(',');
  if (filters.language) params.language = filters.language;
  if (filters.country) params.country = filters.country;
  if (filters.minScore > 0) params.min_score = filters.minScore;
  if (filters.maxScore < 100) params.max_score = filters.maxScore;

  if (sort) {
    params.sort_by = sort.field;
    params.sort_order = sort.order;
  }

  return params;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { token } = antdTheme.useToken();
  const toast = useToast();

  // ---- Filter state -------------------------------------------------------
  const [filters, setFilters] = useState<InboxFilterValues>({ ...DEFAULT_FILTERS });
  const [debouncedFilters, setDebouncedFilters] = useState<InboxFilterValues>(filters);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedFilters(filters), 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters]);

  // ---- Pagination & sorting -----------------------------------------------
  const [pagination, setPagination] = useState<InboxTablePagination>({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [sort, setSort] = useState<SortState | null>(null);

  // ---- Selection ----------------------------------------------------------
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ---- Preview drawer -----------------------------------------------------
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- Data fetching ------------------------------------------------------
  const queryParams = filtersToParams(debouncedFilters, pagination, sort);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.articles.list(queryParams as Record<string, unknown>),
    queryFn: () => getArticles(queryParams),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data) setPagination((prev) => ({ ...prev, total: data.total }));
  }, [data]);

  const articles = data?.items ?? [];

  // ---- Mutations ----------------------------------------------------------
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) =>
      changeStatus(id, { new_status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      toast.success('Stato aggiornato');
    },
    onError: (err) => toast.error(err),
  });

  const batchMutation = useMutation({
    mutationFn: batchAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      setSelectedRowKeys([]);
      toast.success('Azione di massa completata');
    },
    onError: (err) => toast.error(err),
  });

  // ---- Callbacks ----------------------------------------------------------
  const handleFiltersChange = useCallback((next: InboxFilterValues) => {
    setFilters(next);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  }, []);

  const handleSort = useCallback((next: SortState | null) => setSort(next), []);

  const handleRowClick = useCallback((article: Article) => {
    setPreviewArticle(article);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  const handleQuickAction = useCallback(
    (articleId: number, action: 'screened' | 'rejected') => {
      statusMutation.mutate({ id: articleId, newStatus: action });
      setDrawerOpen(false);
    },
    [statusMutation],
  );

  const handleBatchAction = useCallback(
    (payload: BatchActionPayload) => {
      const ids = selectedRowKeys.map(Number);
      if (payload.type === 'status' && payload.newStatus) {
        batchMutation.mutate({
          article_ids: ids,
          action: 'status',
          new_status: payload.newStatus,
        });
      } else if (payload.type === 'discard') {
        batchMutation.mutate({ article_ids: ids, action: 'discard' });
      } else if (payload.type === 'tag') {
        toast.info('Selettore tag in arrivo');
      }
    },
    [selectedRowKeys, batchMutation, toast],
  );

  const handleClearSelection = useCallback(() => setSelectedRowKeys([]), []);

  // ---- Render -------------------------------------------------------------
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
            Inbox
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Filtra, valuta e smista gli articoli importati dalla pipeline di discovery.
          </Text>
        </div>
        <ExportButton endpoint="/api/v1/articles/export" filenamePrefix="inbox_articles" />
      </div>

      {/* Main card: filters + table */}
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <InboxFilters filters={filters} onFiltersChange={handleFiltersChange} />

        <InboxTable
          articles={articles}
          loading={isLoading}
          pagination={pagination}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          onSort={handleSort}
          onRowClick={handleRowClick}
          onPaginationChange={handlePaginationChange}
        />
      </div>

      {/* Floating bulk toolbar (mounted outside the card to float over viewport) */}
      <BatchActionsBar
        selectedIds={selectedRowKeys}
        onAction={handleBatchAction}
        onClear={handleClearSelection}
      />

      <ArticlePreviewDrawer
        article={previewArticle}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
