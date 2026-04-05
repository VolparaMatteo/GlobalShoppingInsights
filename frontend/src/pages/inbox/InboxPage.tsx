// ---------------------------------------------------------------------------
// InboxPage  --  Main editorial inbox: filtered article list with preview
// ---------------------------------------------------------------------------
import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Article } from '@/types';
import { queryKeys } from '@/config/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import {
  getArticles,
  type GetArticlesParams,
} from '@/services/api/articles.api';
import { changeStatus } from '@/services/api/articles.api';
import { batchAction } from '@/services/api/articles.api';

import PageHeader from '@/components/common/PageHeader';
import ExportButton from '@/components/common/ExportButton';

import InboxFilters, {
  DEFAULT_FILTERS,
  type InboxFilterValues,
} from '@/pages/inbox/components/InboxFilters';
import InboxTable, {
  type InboxTablePagination,
  type SortState,
} from '@/pages/inbox/components/InboxTable';
import ArticlePreviewDrawer from '@/pages/inbox/components/ArticlePreviewDrawer';
import BatchActionsBar, {
  type BatchActionPayload,
} from '@/pages/inbox/components/BatchActionsBar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert UI filter state to API query params. */
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

  // ---- Filter state -------------------------------------------------------
  const [filters, setFilters] = useState<InboxFilterValues>({
    ...DEFAULT_FILTERS,
  });

  // Debounce free-text inputs
  const [debouncedFilters, setDebouncedFilters] =
    useState<InboxFilterValues>(filters);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);
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
    keepPreviousData: true,
  });

  // Keep pagination total in sync with API response.
  useEffect(() => {
    if (data) {
      setPagination((prev) => ({ ...prev, total: data.total }));
    }
  }, [data]);

  const articles = data?.items ?? [];

  // ---- Mutations ----------------------------------------------------------
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) =>
      changeStatus(id, { new_status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      message.success('Stato aggiornato');
    },
    onError: () => {
      message.error('Impossibile aggiornare lo stato');
    },
  });

  const batchMutation = useMutation({
    mutationFn: batchAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      setSelectedRowKeys([]);
      message.success('Azione di massa completata');
    },
    onError: () => {
      message.error('Azione di massa fallita');
    },
  });

  // ---- Callbacks ----------------------------------------------------------
  const handleFiltersChange = useCallback(
    (next: InboxFilterValues) => {
      setFilters(next);
      // Reset to first page on filter change.
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    [],
  );

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      setPagination((prev) => ({ ...prev, current: page, pageSize }));
    },
    [],
  );

  const handleSort = useCallback((next: SortState | null) => {
    setSort(next);
  }, []);

  const handleRowClick = useCallback((article: Article) => {
    setPreviewArticle(article);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

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
        batchMutation.mutate({
          article_ids: ids,
          action: 'discard',
        });
      } else if (payload.type === 'tag') {
        message.info('Selettore tag in arrivo');
      }
    },
    [selectedRowKeys, batchMutation],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  // ---- Render -------------------------------------------------------------
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Inbox"
        subtitle="Gestisci gli articoli importati: filtra, valuta e smista."
        extra={
          <ExportButton
            endpoint="/api/v1/articles/export"
            filenamePrefix="inbox_articles"
          />
        }
      />

      <InboxFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <Card>
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

        <BatchActionsBar
          selectedIds={selectedRowKeys}
          onAction={handleBatchAction}
          onClear={handleClearSelection}
        />
      </Card>

      <ArticlePreviewDrawer
        article={previewArticle}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
