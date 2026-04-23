// ---------------------------------------------------------------------------
// FolderPickerModal.tsx — picker per spostare uno o più prompt in una cartella.
//
// Usato da PromptsListPage sia per la move single (click sul pill di riga)
// sia per la bulk move (toolbar quando ci sono righe selezionate).
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Modal, Tree, Typography, theme as antdTheme } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Folder, FolderX } from 'lucide-react';

import type { PromptFolder } from '@/types';

const { Text } = Typography;

const UNFILED_KEY = '__unfiled__';

interface FolderPickerModalProps {
  open: boolean;
  folders: PromptFolder[];
  /** Cartella attualmente assegnata (null = senza cartella). Undefined per bulk move misto. */
  currentFolderId: number | null | undefined;
  title?: string;
  okText?: string;
  loading?: boolean;
  onOk: (folderId: number | null) => void;
  onCancel: () => void;
}

function buildTreeData(
  folders: PromptFolder[],
  tokenColor: string,
  tokenTertiary: string,
): DataNode[] {
  return folders.map((f) => ({
    key: String(f.id),
    title: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <Folder size={13} color={tokenColor} />
        <span>{f.name}</span>
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4, color: tokenTertiary }}>
          {f.prompt_count}
        </Text>
      </span>
    ),
    children:
      f.children.length > 0 ? buildTreeData(f.children, tokenColor, tokenTertiary) : undefined,
  }));
}

function collectKeys(folders: PromptFolder[]): string[] {
  const acc: string[] = [];
  for (const f of folders) {
    acc.push(String(f.id));
    if (f.children.length > 0) acc.push(...collectKeys(f.children));
  }
  return acc;
}

export default function FolderPickerModal({
  open,
  folders,
  currentFolderId,
  title = 'Sposta in cartella',
  okText = 'Sposta',
  loading = false,
  onOk,
  onCancel,
}: FolderPickerModalProps) {
  const { token } = antdTheme.useToken();

  const initialKey = useCallback((): string | null => {
    if (currentFolderId === undefined) return null;
    return currentFolderId === null ? UNFILED_KEY : String(currentFolderId);
  }, [currentFolderId]);

  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey);

  useEffect(() => {
    if (open) setSelectedKey(initialKey());
  }, [open, initialKey]);

  const treeData = useMemo(
    () => buildTreeData(folders, token.colorTextSecondary, token.colorTextTertiary),
    [folders, token.colorTextSecondary, token.colorTextTertiary],
  );
  const expandedKeys = useMemo(() => collectKeys(folders), [folders]);

  const handleOk = () => {
    if (!selectedKey) return;
    if (selectedKey === UNFILED_KEY) onOk(null);
    else onOk(Number(selectedKey));
  };

  const okDisabled =
    !selectedKey ||
    (currentFolderId !== undefined &&
      selectedKey === (currentFolderId === null ? UNFILED_KEY : String(currentFolderId)));

  const unfiledSelected = selectedKey === UNFILED_KEY;

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={okText}
      cancelText="Annulla"
      confirmLoading={loading}
      okButtonProps={{ disabled: okDisabled }}
      centered
      destroyOnClose
    >
      <div style={{ maxHeight: 420, overflow: 'auto', padding: '4px 2px' }}>
        <button
          type="button"
          onClick={() => setSelectedKey(UNFILED_KEY)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: unfiledSelected
              ? 'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)'
              : 'transparent',
            border: 'none',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            color: unfiledSelected ? token.colorPrimary : token.colorText,
            fontWeight: unfiledSelected ? 600 : 500,
            fontSize: 13,
            marginBottom: folders.length > 0 ? 8 : 0,
            transition: 'background 150ms',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            if (!unfiledSelected) e.currentTarget.style.background = token.colorBgLayout;
          }}
          onMouseLeave={(e) => {
            if (!unfiledSelected) e.currentTarget.style.background = 'transparent';
          }}
        >
          <FolderX size={15} />
          <span>Senza cartella</span>
        </button>

        {folders.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: token.colorBorderSecondary,
                margin: '0 4px 8px',
              }}
            />
            <Tree
              treeData={treeData}
              defaultExpandedKeys={expandedKeys}
              selectedKeys={selectedKey && selectedKey !== UNFILED_KEY ? [selectedKey] : []}
              onSelect={(keys) => {
                if (keys.length > 0) setSelectedKey(keys[0] as string);
              }}
              blockNode
              showLine={false}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
