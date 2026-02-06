import { useState, useCallback, useMemo } from 'react';
import type { TablePaginationConfig, SorterResult } from 'antd/es/table/interface';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

export interface TableParams {
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'ascend' | 'descend';
}

/**
 * Manages Ant Design Table pagination and sorting state, converting it into
 * API-friendly query params.
 *
 * @example
 *   const { tableParams, apiParams, handleTableChange } = useTableParams();
 *   // Pass apiParams to your React Query hook's filters
 *   // Pass handleTableChange to <Table onChange={handleTableChange} />
 */
export function useTableParams(initial?: Partial<TableParams>) {
  const [tableParams, setTableParams] = useState<TableParams>({
    page: initial?.page ?? 1,
    page_size: initial?.page_size ?? DEFAULT_PAGE_SIZE,
    sort_by: initial?.sort_by,
    sort_order: initial?.sort_order,
  });

  /**
   * Handler to wire directly into Ant Design's `<Table onChange={...} />`.
   */
  const handleTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      _filters: Record<string, unknown>,
      sorter: SorterResult<unknown> | SorterResult<unknown>[],
    ) => {
      const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;

      setTableParams({
        page: pagination.current ?? 1,
        page_size: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
        sort_by: singleSorter?.field as string | undefined,
        sort_order: singleSorter?.order ?? undefined,
      });
    },
    [],
  );

  /**
   * API-friendly params object (strips undefined values).
   */
  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page: tableParams.page,
      page_size: tableParams.page_size,
    };

    if (tableParams.sort_by) {
      params.sort_by = tableParams.sort_by;
      params.sort_order = tableParams.sort_order === 'descend' ? 'desc' : 'asc';
    }

    return params;
  }, [tableParams]);

  /** Reset to page 1 (useful when filters change). */
  const resetPage = useCallback(() => {
    setTableParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    tableParams,
    apiParams,
    handleTableChange,
    resetPage,
  };
}
