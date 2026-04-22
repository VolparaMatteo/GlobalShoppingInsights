// ---------------------------------------------------------------------------
// PromptsListPage.tsx — Sprint 7 polish b7 (premium, Lucide, dark-mode aware)
// ---------------------------------------------------------------------------
import { useCallback, useMemo, useState } from 'react';

import { App, Button, Input, Modal, Table, Tooltip, Typography, theme as antdTheme } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, FolderTree, Inbox, Pause, Play, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import EmptyIllustrated from '@/components/common/EmptyIllustrated';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/config/constants';
import { queryKeys } from '@/config/queryKeys';
import {
  useCreatePromptFolder,
  useDeletePromptFolder,
  usePromptFolders,
  useUpdatePromptFolder,
} from '@/hooks/queries/usePromptFolders';
import { useToast } from '@/hooks/useToast';
import PromptFolderTree from '@/pages/prompts/components/PromptFolderTree';
import { getPrompts } from '@/services/api/prompts.api';
import type { Prompt, PromptFolder } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Types + hooks
// ---------------------------------------------------------------------------

type FolderSelection = number | 'unfiled' | null;

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
  if (typeof params.selectedFolder === 'number') apiParams.folder_id = params.selectedFolder;
  else if (params.selectedFolder === 'unfiled') apiParams.unfiled = true;

  return useQuery({
    queryKey: queryKeys.prompts.list(apiParams),
    queryFn: () => getPrompts(apiParams),
    placeholderData: (prev) => prev,
  });
}

function countAllPrompts(folders: PromptFolder[]): number {
  let total = 0;
  for (const f of folders) {
    total += f.prompt_count;
    if (f.children.length > 0) total += countAllPrompts(f.children);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Sub-component: SidebarItem
// ---------------------------------------------------------------------------

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, count, active, onClick }: SidebarItemProps) {
  const { token } = antdTheme.useToken();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        background: active
          ? 'linear-gradient(135deg, rgba(22,119,255,0.12) 0%, rgba(114,46,209,0.12) 100%)'
          : 'transparent',
        color: active ? token.colorPrimary : token.colorText,
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
        lineHeight: 1.4,
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = token.colorBgLayout;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {icon}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}
        >
          {label}
        </span>
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: token.colorTextTertiary,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// FolderSidebar
// ---------------------------------------------------------------------------

interface FolderSidebarProps {
  folders: PromptFolder[];
  foldersLoading: boolean;
  selectedFolder: FolderSelection;
  onSelect: (folder: FolderSelection) => void;
  totalPrompts: number;
}

function FolderSidebar({
  folders,
  foldersLoading,
  selectedFolder,
  onSelect,
  totalPrompts,
}: FolderSidebarProps) {
  const { token } = antdTheme.useToken();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { modal } = App.useApp();

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
        await createMutation.mutateAsync({ name: trimmed, parent_id: parentIdForCreate });
        toast.success('Cartella creata');
      } else if (editingFolder) {
        await updateMutation.mutateAsync({ id: editingFolder.id, data: { name: trimmed } });
        toast.success('Cartella rinominata');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err);
    }
  }, [
    folderName,
    modalMode,
    editingFolder,
    parentIdForCreate,
    createMutation,
    updateMutation,
    toast,
  ]);

  const handleDeleteFolder = useCallback(
    (folder: PromptFolder) => {
      const childCount = folder.children.length;
      const extraMsg = childCount > 0 ? ` Le ${childCount} sotto-cartelle verranno eliminate.` : '';
      modal.confirm({
        title: 'Elimina cartella',
        content: `Eliminare "${folder.name}"?${extraMsg} I prompt contenuti non verranno eliminati, ma saranno spostati tra quelli senza cartella.`,
        okText: 'Elimina',
        okType: 'danger',
        cancelText: 'Annulla',
        centered: true,
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(folder.id);
            toast.success('Cartella eliminata');
            if (selectedFolder === folder.id) onSelect(null);
            queryClient.invalidateQueries({ queryKey: queryKeys.prompts.lists() });
          } catch (err) {
            toast.error(err);
          }
        },
      });
    },
    [deleteMutation, selectedFolder, onSelect, queryClient, modal, toast],
  );

  const selectedNumericId = typeof selectedFolder === 'number' ? selectedFolder : null;

  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        background: token.colorBgContainer,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignSelf: 'stretch',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          padding: '0 6px',
        }}
      >
        <FolderTree size={14} color={token.colorTextTertiary} />
        <Text
          strong
          style={{
            fontSize: 10.5,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: token.colorTextTertiary,
          }}
        >
          Cartelle
        </Text>
      </div>

      <SidebarItem
        icon={<FolderOpen size={15} />}
        label="Tutti i prompt"
        count={totalPrompts}
        active={selectedFolder === null}
        onClick={() => onSelect(null)}
      />
      <SidebarItem
        icon={<Inbox size={15} />}
        label="Senza cartella"
        count={unfiledCount}
        active={selectedFolder === 'unfiled'}
        onClick={() => onSelect('unfiled')}
      />

      {folders.length > 0 && (
        <div
          style={{
            height: 1,
            background: token.colorBorderSecondary,
            margin: '10px 4px',
          }}
        />
      )}

      {foldersLoading ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Caricamento…
          </Text>
        </div>
      ) : folders.length > 0 ? (
        <div
          className="gsi-folder-tree-wrap"
          style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingTop: 4 }}
        >
          <style>{`
            .gsi-folder-row:hover {
              background: ${token.colorBgLayout} !important;
            }
            .gsi-folder-row:hover .gsi-folder-actions,
            .gsi-folder-row:focus-within .gsi-folder-actions {
              opacity: 1 !important;
            }
          `}</style>
          <PromptFolderTree
            folders={folders}
            selectedId={selectedNumericId}
            onSelect={(id) => onSelect(id)}
            onRename={openRename}
            onCreateChild={(parentId) => openCreate(parentId)}
            onDelete={handleDeleteFolder}
          />
        </div>
      ) : null}

      <div style={{ marginTop: folders.length > 0 ? 8 : 6 }}>
        <Button
          type="dashed"
          icon={<Plus size={14} />}
          block
          onClick={() => openCreate(null)}
          style={{ borderRadius: 8, height: 36 }}
        >
          Nuova cartella
        </Button>
      </div>

      <Modal
        title={
          modalMode === 'create'
            ? parentIdForCreate
              ? 'Nuova sottocartella'
              : 'Nuova cartella'
            : 'Rinomina cartella'
        }
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText={modalMode === 'create' ? 'Crea' : 'Salva'}
        cancelText="Annulla"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        centered
      >
        <Input
          placeholder="Nome della cartella"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          maxLength={100}
          onPressEnter={handleModalOk}
          autoFocus
          size="large"
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PromptsListPage() {
  const navigate = useNavigate();
  const { token } = antdTheme.useToken();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderSelection>(null);

  const { data: foldersData, isLoading: foldersLoading } = usePromptFolders();
  const folders = foldersData ?? [];

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

  const columns: ColumnsType<Prompt> = useMemo(
    () => [
      {
        title: 'Titolo',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (t: string) => <span style={{ fontWeight: 500, color: token.colorText }}>{t}</span>,
      },
      {
        title: 'Pianificazione',
        key: 'schedule',
        width: 160,
        align: 'center' as const,
        render: (_: unknown, record: Prompt) => <ScheduleBadge enabled={record.schedule_enabled} />,
      },
      {
        title: 'Ultima esecuzione',
        dataIndex: 'last_run_at',
        key: 'last_run',
        width: 180,
        render: (val: string | null) =>
          val ? (
            <Tooltip title={dayjs(val).format('DD/MM/YYYY HH:mm:ss')}>
              <Text style={{ fontSize: 13 }}>{dayjs(val).format('DD/MM/YY HH:mm')}</Text>
            </Tooltip>
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>
              —
            </Text>
          ),
      },
    ],
    [token.colorText],
  );

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

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0 && !search;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ---- Header with gradient CTA ---- */}
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
            Prompt di ricerca
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Organizza in cartelle, schedula l'esecuzione, monitora lo storico.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} strokeWidth={2.4} />}
          onClick={() => navigate('/prompts/new')}
          style={{
            height: 40,
            borderRadius: 10,
            fontWeight: 600,
            padding: '0 18px',
            background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
            border: 'none',
            boxShadow: '0 4px 12px -2px rgba(114,46,209,0.35)',
          }}
        >
          Nuovo prompt
        </Button>
      </div>

      {/* ---- Layout: sidebar + main card ---- */}
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
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: 20,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Input
            placeholder="Cerca prompt per titolo…"
            prefix={<Search size={15} style={{ color: token.colorTextTertiary }} />}
            allowClear
            style={{
              maxWidth: 380,
              marginBottom: 16,
              height: 40,
              borderRadius: 10,
            }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          {isEmpty ? (
            <EmptyIllustrated
              variant="prompts"
              title={
                selectedFolder === 'unfiled'
                  ? 'Nessun prompt senza cartella'
                  : 'Nessun prompt ancora creato'
              }
              description="Crea un prompt di ricerca per iniziare a scoprire articoli automaticamente. Puoi organizzarli in cartelle gerarchiche."
              actionLabel="Nuovo prompt"
              onAction={() => navigate('/prompts/new')}
            />
          ) : (
            <Table<Prompt>
              rowKey="id"
              columns={columns}
              dataSource={items}
              loading={isLoading}
              pagination={pagination}
              onRow={(record) => ({
                onClick: () => navigate(`/prompts/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              size="middle"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScheduleBadge
// ---------------------------------------------------------------------------

function ScheduleBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 9px',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-success)',
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success)33',
          borderRadius: 'var(--border-radius-md)',
          lineHeight: 1,
        }}
      >
        <Play size={11} strokeWidth={2.4} aria-hidden="true" />
        Attiva
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--color-text-tertiary)',
        background: 'var(--color-bg-layout)',
        border: '1px solid var(--color-border-secondary)',
        borderRadius: 'var(--border-radius-md)',
        lineHeight: 1,
      }}
    >
      <Pause size={11} strokeWidth={2.4} aria-hidden="true" />
      Disattivata
    </span>
  );
}
