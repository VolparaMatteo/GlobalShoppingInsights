// ---------------------------------------------------------------------------
// SlotCard.tsx  --  Card draggable per uno slot editoriale
// ---------------------------------------------------------------------------
import React from 'react';
import { Tag, Typography, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';

import { STATUS_MAP } from '@/config/constants';
import type { EditorialSlot } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: EditorialSlot;
  detailed?: boolean;
  overlay?: boolean;
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const SLOT_STATUS_COLORS: Record<string, string> = {
  scheduled: '#722ed1',
  publishing: '#13c2c2',
  published: '#389e0d',
  failed: '#ff4d4f',
};

const SLOT_TAG_COLORS: Record<string, string> = {
  scheduled: 'purple',
  publishing: 'cyan',
  published: 'green',
  failed: 'red',
};

function getStatusLabel(status: string): string {
  const entry = STATUS_MAP[status as keyof typeof STATUS_MAP];
  return entry?.label ?? status;
}

function getBorderColor(status: string): string {
  return SLOT_STATUS_COLORS[status] || '#d9d9d9';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SlotCard({
  slot,
  detailed = false,
  overlay = false,
  onClick,
}: SlotCardProps) {
  const isLocked = slot.status === 'published' || slot.status === 'failed';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(slot.id),
    data: { slot },
    disabled: overlay || isLocked,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isLocked ? 'pointer' : overlay ? 'grabbing' : 'grab',
    borderLeft: `3px solid ${getBorderColor(slot.status)}`,
    background: '#fff',
    borderRadius: 6,
    padding: detailed ? '8px 10px' : '4px 6px',
    boxShadow: overlay
      ? '0 4px 12px rgba(0,0,0,0.15)'
      : '0 1px 2px rgba(0,0,0,0.06)',
    fontSize: 12,
    lineHeight: 1.4,
    transition: overlay ? undefined : 'box-shadow 0.2s',
    userSelect: 'none',
  };

  const title = slot.article_title || `Slot #${slot.id}`;
  const time = dayjs(slot.scheduled_for).format('HH:mm');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <Tooltip title={title} mouseEnterDelay={0.5}>
        <Typography.Text
          ellipsis
          style={{
            display: 'block',
            fontWeight: 500,
            fontSize: detailed ? 13 : 12,
            maxWidth: '100%',
          }}
        >
          {title}
        </Typography.Text>
      </Tooltip>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
          flexWrap: 'wrap',
        }}
      >
        <ClockCircleOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {time}
        </Typography.Text>
        <Tag
          color={SLOT_TAG_COLORS[slot.status] || 'default'}
          style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
        >
          {getStatusLabel(slot.status)}
        </Tag>
      </div>

      {detailed && slot.article_title && (
        <Typography.Paragraph
          type="secondary"
          ellipsis={{ rows: 2 }}
          style={{ margin: '4px 0 0', fontSize: 11 }}
        >
          {slot.article_title}
        </Typography.Paragraph>
      )}
    </div>
  );
}
