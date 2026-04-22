// ---------------------------------------------------------------------------
// PromptFolderTree.tsx — Sprint 7 polish b7
//
// Albero custom ricorsivo per le cartelle prompt. Sostituisce antTree perché:
//   - Controllo pieno su padding/indent (base 16px * depth)
//   - Icona folder inline col testo, counter sempre a destra
//   - ChevronRight che ruota su expand (animazione 150ms)
//   - Hover/active state coerente con SidebarItem della stessa pagina
//   - Dropdown "..." visibile al hover, non al click casuale
// ---------------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { Button, Dropdown, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import { ChevronRight, Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { PromptFolder } from '@/types';

interface PromptFolderTreeProps {
  folders: PromptFolder[];
  selectedId: number | null;
  onSelect: (folderId: number) => void;
  onRename: (folder: PromptFolder) => void;
  onCreateChild: (parentId: number) => void;
  onDelete: (folder: PromptFolder) => void;
}

function collectIds(folders: PromptFolder[], acc: Set<number> = new Set()): Set<number> {
  for (const f of folders) {
    if (f.children.length > 0) {
      acc.add(f.id);
      collectIds(f.children, acc);
    }
  }
  return acc;
}

export default function PromptFolderTree({
  folders,
  selectedId,
  onSelect,
  onRename,
  onCreateChild,
  onDelete,
}: PromptFolderTreeProps) {
  // Expanded state: default tutti aperti (stesso comportamento del vecchio antTree).
  const [expanded, setExpanded] = useState<Set<number>>(() => collectIds(folders));

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <ul
      role="tree"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {folders.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
          onRename={onRename}
          onCreateChild={onCreateChild}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// FolderNode (ricorsivo)
// ---------------------------------------------------------------------------

interface FolderNodeProps {
  folder: PromptFolder;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  selectedId: number | null;
  onSelect: (folderId: number) => void;
  onRename: (folder: PromptFolder) => void;
  onCreateChild: (parentId: number) => void;
  onDelete: (folder: PromptFolder) => void;
}

function FolderNode({
  folder,
  depth,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  onRename,
  onCreateChild,
  onDelete,
}: FolderNodeProps) {
  const { token } = antdTheme.useToken();
  const hasChildren = folder.children.length > 0;
  const isExpanded = expanded.has(folder.id);
  const isSelected = selectedId === folder.id;

  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      icon: <Pencil size={13} />,
      label: 'Rinomina',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onRename(folder);
      },
    },
    {
      key: 'subfolder',
      icon: <FolderPlus size={13} />,
      label: 'Nuova sottocartella',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onCreateChild(folder.id);
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <Trash2 size={13} />,
      label: 'Elimina',
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onDelete(folder);
      },
    },
  ];

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        onClick={() => onSelect(folder.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(folder.id);
          }
        }}
        className="gsi-folder-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px 7px 8px',
          paddingLeft: 8 + depth * 14,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 150ms',
          background: isSelected
            ? 'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)'
            : 'transparent',
          color: isSelected ? token.colorPrimary : token.colorText,
          fontWeight: isSelected ? 600 : 500,
        }}
      >
        {/* Switcher ChevronRight: ruota 90° quando espanso, placeholder vuoto se no children */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(folder.id);
          }}
          aria-label={isExpanded ? 'Chiudi' : 'Apri'}
          tabIndex={-1}
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
            color: token.colorTextTertiary,
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          <ChevronRight
            size={14}
            strokeWidth={2.2}
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 150ms',
            }}
          />
        </button>

        {/* Icona cartella */}
        <Folder
          size={15}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            color: isSelected ? token.colorPrimary : token.colorTextSecondary,
          }}
          aria-hidden="true"
        />

        {/* Nome */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13.5,
            lineHeight: 1.4,
          }}
        >
          {folder.name}
        </span>

        {/* Counter */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isSelected ? token.colorPrimary : token.colorTextTertiary,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 18,
            textAlign: 'right',
          }}
        >
          {folder.prompt_count}
        </span>

        {/* Actions dropdown (visibile al hover) */}
        <Dropdown trigger={['click']} menu={{ items: menuItems }}>
          <Button
            type="text"
            size="small"
            icon={<MoreHorizontal size={13} />}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Azioni su ${folder.name}`}
            className="gsi-folder-actions"
            style={{
              minWidth: 22,
              width: 22,
              height: 22,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              opacity: 0,
              transition: 'opacity 150ms',
              color: token.colorTextSecondary,
              flexShrink: 0,
            }}
          />
        </Dropdown>
      </div>

      {/* Children (indented) */}
      {hasChildren && isExpanded && (
        <ul
          role="group"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
