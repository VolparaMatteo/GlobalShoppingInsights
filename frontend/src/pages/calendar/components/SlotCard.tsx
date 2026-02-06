// ---------------------------------------------------------------------------
// SlotCard.tsx  --  Draggable card representing a scheduled editorial slot
// ---------------------------------------------------------------------------
import React from 'react';
import { Tag, Typography, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';

import type { EditorialSlot } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: EditorialSlot;
  /** When true renders an expanded card (used in DayView). */
  detailed?: boolean;
  /** When true the card is being rendered inside a DragOverlay. */
  overlay?: boolean;
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Status colour mapping
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#1677ff',   // blue
  publishing: '#fa8c16',  // orange
  published: '#52c41a',   // green
  failed: '#ff4d4f',      // red
};

const STATUS_TAG_COLORS: Record<string, string> = {
  scheduled: 'blue',
  publishing: 'orange',
  published: 'green',
  failed: 'red',
};

function getBorderColor(status: string): string {
  return STATUS_COLORS[status] || '#d9d9d9';
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(slot.id),
    data: { slot },
    disabled: overlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: overlay ? 'grabbing' : 'grab',
    borderLeft: `3px solid ${getBorderColor(slot.status)}`,
    background: '#fff',
    borderRadius: 4,
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
  const time = dayjs(slot.scheduled_for).format('h:mm A');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Prevent triggering click when finishing a drag
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
        <ClockCircleOutlined style={{ fontSize: 10, color: '#999' }} />
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {time}
        </Typography.Text>
        <Tag
          color={STATUS_TAG_COLORS[slot.status] || 'default'}
          style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
        >
          {slot.status}
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
