import { useState, useCallback, useMemo } from 'react';

/**
 * Manages a set of selected row IDs for batch operations in tables.
 *
 * @example
 *   const { selectedIds, rowSelection, clearSelection, hasSelection } = useBatchSelection();
 *   // Pass rowSelection to <Table rowSelection={rowSelection} />
 *   // Use selectedIds for batch action payloads
 */
export function useBatchSelection<K extends React.Key = number>() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<K[]>([]);

  /** Ant Design-compatible rowSelection config object. */
  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => {
        setSelectedRowKeys(keys as K[]);
      },
      preserveSelectedRowKeys: true,
    }),
    [selectedRowKeys],
  );

  /** The selected IDs as a typed array. */
  const selectedIds = selectedRowKeys;

  /** Number of selected items. */
  const count = selectedRowKeys.length;

  /** Whether any rows are selected. */
  const hasSelection = count > 0;

  /** Clears the entire selection. */
  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  /** Toggles a single ID in the selection. */
  const toggle = useCallback((key: K) => {
    setSelectedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  /** Selects all provided keys (union with current selection). */
  const selectAll = useCallback((keys: K[]) => {
    setSelectedRowKeys((prev) => {
      const set = new Set([...prev, ...keys]);
      return Array.from(set);
    });
  }, []);

  return {
    selectedIds,
    selectedRowKeys,
    rowSelection,
    count,
    hasSelection,
    clearSelection,
    toggle,
    selectAll,
  };
}
