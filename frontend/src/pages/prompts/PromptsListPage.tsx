// ---------------------------------------------------------------------------
// PromptsListPage.tsx  --  Paginated table listing all search prompts
//                          with a left sidebar for folder navigation (tree)
// ---------------------------------------------------------------------------
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dropdown, Input, Modal, Table, Tag, Tree, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
  SubnodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { getPrompts } from '@/services/api/prompts.api';
import { queryKeys } from '@/config/queryKeys';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/config/constants';
import {
  usePromptFolders,
  useCreatePromptFolder,
  useUpdatePromptFolder,
  useDeletePromptFolder,
} from '@/hooks/queries/usePromptFolders';
import type { Prompt, PromptFolder } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FolderSelection = number | 'unfiled' | null; // null = "Tutti"

// ---------------------------------------------------------------------------
// Hook: usePrompts (local to this page)
// ---------------------------------------------------------------------------

function usePrompts(params: {
  page: number;
  pageSize: number;
  search: string;
  selectedFolder: FolderSelection;
}) {
  const apiParams: Record<string, unknown> = {
    page: params.page,
    page_size: params.pageSize,
    search: params.search || undefined,
  };
  if (typeof params.selectedFolder === 'number') {
    apiParams.folder_id = params.selectedFolder;
  } else if (params.selectedFolder === 'unfiled') {
    apiParams.unfiled = true;
  }

  return useQuery({
    queryKey: queryKeys.prompts.list(apiParams),
    queryFn: () => getPrompts(apiParams),
    placeholderData: (prev) => prev,
  });
}

// ---------------------------------------------------------------------------
// Helper: build Ant Design Tree data from nested PromptFolder[]
// ---------------------------------------------------------------------------

function buildTreeData(
  folders: PromptFolder[],
  renderTitle: (folder: PromptFolder) => React.ReactNode,
): DataNode[] {
  return folders.map((f) => ({
    key: String(f.id),
    title: renderTitle(f),
    icon: <FolderOutlined style={{ color: 'var(--color-text-tertiary)' }} />,
    children: f.children.length > 0 ? buildTreeData(f.children, renderTitle) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Helper: count total prompts across a folder tree (recursive)
// ---------------------------------------------------------------------------

function countAllPrompts(folders: PromptFolder[]): number {
  let total = 0;
  for (const f of folders) {
    total += f.prompt_count;
    if (f.children.length > 0) total += countAllPrompts(f.children);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const SIDEBAR_ITEM_BASE: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 'var(--border-radius-md)',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'background var(--transition-fast)',
  fontSize: 'var(--font-size-base)',
  lineHeight: 1.5,
  userSelect: 'none',
};

// ---------------------------------------------------------------------------
// Sub-component: SidebarItem (Tutti / Senza cartella)
// ---------------------------------------------------------------------------

function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        ...SIDEBAR_ITEM_BASE,
        background: active ? 'var(--color-primary-bg)' : 'transparent',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {icon}
        <span className="text-ellipsis" style={{ flex: 1, minWidth: 0 }}>
          {label}
        </span>
      </span>
      <Text
        type="secondary"
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 400,
          flexShrink: 0,
          marginLeft: 8,
        }}
      >
        {count}
      </Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: FolderSidebar
// ---------------------------------------------------------------------------

function FolderSidebar({
  folders,
  foldersLoading,
  selectedFolder,
  onSelect,
  totalPrompts,
}: {
  folders: PromptFolder[];
  foldersLoading: boolean;
  selectedFolder: FolderSelection;
  onSelect: (folder: FolderSelection) => void;
  totalPrompts: number;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreatePromptFolder();
  const updateMutation = useUpdatePromptFolder();
  const deleteMutation = useDeletePromptFolder();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'rename'>('create');
  const [editingFolder, setEditingFolder] = useState<PromptFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [parentIdForCreate, setParentIdForCreate] = useState<number | null>(null);

  const assignedCount = useMemo(() => countAllPrompts(folders), [folders]);
  const unfiledCount = Math.max(0, totalPrompts - assignedCount);

  const openCreate = useCallback((parentId: number | null = null) => {
    setModalMode('create');
    setEditingFolder(null);
    setParentIdForCreate(parentId);
    setFolderName('');
    setModalOpen(true);
  }, []);

  const openRename = useCallback((folder: PromptFolder) => {
    setModalMode('rename');
    setEditingFolder(folder);
    setFolderName(folder.name);
    setModalOpen(true);
  }, []);

  const handleModalOk = useCallback(async () => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync({
          name: trimmed,
          parent_id: parentIdForCreate,
        });
        message.success('Cartella creata');
      } else if (editingFolder) {
        await updateMutation.mutateAsync({ id: editingFolder.id, data: { name: trimmed } });
        message.success('Cartella rinominata');
      }
      setModalOpen(false);
    } catch {
      message.error(
        modalMode === 'create'
          ? 'Impossibile creare la cartella'
          : 'Impossibile rinominare la cartella',
      );
    }
  }, [folderName, modalMode, editingFolder, parentIdForCreate, createMutation, updateMutation]);

  const handleDeleteFolder = useCallback(
    (folder: PromptFolder) => {
      const childCount = folder.children.length;
      const extraMsg = childCount > 0 ? ` Le ${childCount} sotto-cartelle verranno eliminate.` : '';
      Modal.confirm({
        title: 'Elimina Cartella',
        content: `Eliminare "${folder.name}"?${extraMsg} I prompt contenuti non verranno eliminati, ma saranno spostati tra quelli senza cartella.`,
        okText: 'Elimina',
        okType: 'danger',
        cancelText: 'Annulla',
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(folder.id);
            message.success('Cartella eliminata');
            if (selectedFolder === folder.id) onSelect(null);
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
          } catch {
            message.error('Impossibile eliminare la cartella');
          }
        },
      });
    },
    [deleteMutation, selectedFolder, onSelect, queryClient],
  );

  // Render title for each tree node
  const renderNodeTitle = useCallback(
    (folder: PromptFolder) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '2px 0',
          gap: 6,
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 'var(--font-size-base)',
          }}
        >
          {folder.name}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1 }}>
            {folder.prompt_count}
          </Text>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'rename',
                  icon: <EditOutlined />,
                  label: 'Rinomina',
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    openRename(folder);
                  },
                },
                {
                  key: 'subfolder',
                  icon: <SubnodeOutlined />,
                  label: 'Nuova Sottocartella',
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    openCreate(folder.id);
                  },
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Elimina',
                  danger: true,
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleDeleteFolder(folder);
                  },
                },
              ],
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined />}
              onClick={(e) => e.stopPropagation()}
              className="folder-action-btn"
              style={{
                minWidth: 22,
                width: 22,
                height: 22,
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--border-radius-sm)',
                opacity: 0,
                transition: 'opacity var(--transition-fast)',
              }}
            />
          </Dropdown>
        </span>
      </div>
    ),
    [openRename, openCreate, handleDeleteFolder],
  );

  const treeData = useMemo(
    () => buildTreeData(folders, renderNodeTitle),
    [folders, renderNodeTitle],
  );

  const selectedKeys = useMemo(() => {
    if (typeof selectedFolder === 'number') return [String(selectedFolder)];
    return [];
  }, [selectedFolder]);

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: 'var(--color-bg-container)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--color-border-secondary)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignSelf: 'stretch',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <Text
          strong
          style={{
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-text-tertiary)',
          }}
        >
          Cartelle
        </Text>
      </div>

      {/* Special entries */}
      <SidebarItem
        icon={<FolderOpenOutlined />}
        label="Tutti i prompt"
        count={totalPrompts}
        active={selectedFolder === null}
        onClick={() => onSelect(null)}
      />
      <SidebarItem
        icon={<InboxOutlined />}
        label="Senza cartella"
        count={unfiledCount}
        active={selectedFolder === 'unfiled'}
        onClick={() => onSelect('unfiled')}
      />

      {/* Divider */}
      {treeData.length > 0 && (
        <div style={{ height: 1, background: 'var(--color-border-secondary)', margin: '8px 0' }} />
      )}

      {/* Folder tree */}
      {foldersLoading ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            Caricamento...
          </Text>
        </div>
      ) : treeData.length > 0 ? (
        <div className="folder-tree-wrap" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <style>{`
            .folder-tree-wrap .ant-tree {
              background: transparent;
              font-size: var(--font-size-base);
            }
            .folder-tree-wrap .ant-tree .ant-tree-node-content-wrapper {
              display: flex;
              align-items: center;
              min-width: 0;
              border-radius: var(--border-radius-md);
              padding: 4px 8px;
              transition: background var(--transition-fast);
            }
            .folder-tree-wrap .ant-tree .ant-tree-title {
              flex: 1;
              min-width: 0;
            }
            .folder-tree-wrap .ant-tree .ant-tree-treenode {
              padding: 1px 0;
              width: 100%;
            }
            .folder-tree-wrap .ant-tree .ant-tree-node-content-wrapper:hover .folder-action-btn,
            .folder-tree-wrap .ant-tree .ant-tree-node-selected .folder-action-btn {
              opacity: 1 !important;
            }
            .folder-tree-wrap .ant-tree .ant-tree-node-content-wrapper:hover {
              background: var(--color-border-secondary);
            }
            .folder-tree-wrap .ant-tree .ant-tree-node-selected {
              background: var(--color-primary-bg) !important;
            }
            .folder-tree-wrap .ant-tree .ant-tree-switcher {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
            }
          `}</style>
          <Tree
            showIcon
            defaultExpandAll
            blockNode
            selectedKeys={selectedKeys}
            treeData={treeData}
            onSelect={(keys) => {
              if (keys.length > 0) onSelect(Number(keys[0]));
            }}
          />
        </div>
      ) : null}

      {/* Create button */}
      <div style={{ marginTop: treeData.length > 0 ? 8 : 4 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          onClick={() => openCreate(null)}
          style={{ borderRadius: 'var(--border-radius-md)' }}
        >
          Nuova Cartella
        </Button>
      </div>

      {/* Folder create/rename modal */}
      <Modal
        title={
          modalMode === 'create'
            ? parentIdForCreate
              ? 'Nuova Sottocartella'
              : 'Nuova Cartella'
            : 'Rinomina Cartella'
        }
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === 'create' ? 'Crea' : 'Salva'}
        cancelText="Annulla"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Input
          placeholder="Nome della cartella"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          maxLength={100}
          onPressEnter={handleModalOk}
          autoFocus
        />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PromptsListPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderSelection>(null);

  const { data: foldersData, isLoading: foldersLoading } = usePromptFolders();
  const folders = foldersData ?? [];

  // We need total count of all prompts (no folder filter) for the sidebar
  const { data: allPromptsData } = useQuery({
    queryKey: queryKeys.prompts.list({ page: 1, page_size: 1 }),
    queryFn: () => getPrompts({ page: 1, page_size: 1 }),
  });
  const totalPrompts = allPromptsData?.total ?? 0;

  const { data, isLoading } = usePrompts({ page, pageSize, search, selectedFolder });

  const handleFolderSelect = useCallback((folder: FolderSelection) => {
    setSelectedFolder(folder);
    setPage(1);
  }, []);

  // ---- Columns -----------------------------------------------------------

  const columns: ColumnsType<Prompt> = useMemo(
    () => [
      {
        title: 'Titolo',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: 'Pianificazione',
        key: 'schedule',
        width: 130,
        align: 'center' as const,
        render: (_: unknown, record: Prompt) =>
          record.schedule_enabled ? <Tag color="green">Attiva</Tag> : <Tag>Disattivata</Tag>,
      },
      {
        title: 'Ultima Esecuzione',
        dataIndex: 'last_run_at',
        key: 'last_run',
        width: 170,
        render: (val: string | null) => (val ? dayjs(val).format('DD/MM/YY HH:mm') : '--'),
      },
    ],
    [],
  );

  // ---- Pagination config -------------------------------------------------

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total: data?.total ?? 0,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
    showTotal: (total, range) => `${range[0]}-${range[1]} di ${total} prompt`,
    onChange: (newPage, newPageSize) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
  };

  // ---- Render ------------------------------------------------------------

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
            Prompt di Ricerca
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Gestisci e monitora i tuoi prompt di ricerca automatizzati.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/prompts/new')}>
          Nuovo Prompt
        </Button>
      </div>

      {/* Sidebar + Table layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <FolderSidebar
          folders={folders}
          foldersLoading={foldersLoading}
          selectedFolder={selectedFolder}
          onSelect={handleFolderSelect}
          totalPrompts={totalPrompts}
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--color-bg-container)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-border-secondary)',
            padding: 20,
          }}
        >
          <Input
            placeholder="Cerca prompt per titolo..."
            prefix={<SearchOutlined style={{ color: 'var(--color-text-quaternary)' }} />}
            allowClear
            style={{ maxWidth: 360, marginBottom: 16 }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

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
            size="middle"
          />
        </div>
      </div>
    </div>
  );
}
