// ---------------------------------------------------------------------------
// CollisionModal.tsx  --  Warning modal when a scheduling collision is detected
// ---------------------------------------------------------------------------
import React from 'react';
import { Modal, Typography, List, Tag } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { EditorialSlot } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CollisionData {
  existingSlots: EditorialSlot[];
  targetDate: string;
  slotId: number;
}

interface CollisionModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  collisionData: CollisionData | null;
}

// ---------------------------------------------------------------------------
// Status tag colours (mirrors SlotCard mapping)
// ---------------------------------------------------------------------------

const STATUS_TAG_COLORS: Record<string, string> = {
  scheduled: 'blue',
  publishing: 'orange',
  published: 'green',
  failed: 'red',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CollisionModal({
  open,
  onOk,
  onCancel,
  collisionData,
}: CollisionModalProps) {
  if (!collisionData) return null;

  const { existingSlots, targetDate } = collisionData;
  const formattedDate = dayjs(targetDate).format('dddd, MMMM D, YYYY');

  return (
    <Modal
      open={open}
      title={
        <span>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Scheduling Collision
        </span>
      }
      okText="Schedule Anyway"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Typography.Paragraph>
        There {existingSlots.length === 1 ? 'is' : 'are'} already{' '}
        <strong>{existingSlots.length}</strong>{' '}
        slot{existingSlots.length !== 1 ? 's' : ''} scheduled on{' '}
        <strong>{formattedDate}</strong>. Adding another slot may exceed the
        daily publishing limit.
      </Typography.Paragraph>

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Existing slots on this day:
      </Typography.Text>

      <List
        size="small"
        bordered
        dataSource={existingSlots}
        renderItem={(slot) => (
          <List.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <ClockCircleOutlined style={{ color: '#999' }} />
              <Typography.Text style={{ flex: 1 }} ellipsis>
                {slot.article_title || `Slot #${slot.id}`}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                {dayjs(slot.scheduled_for).format('h:mm A')}
              </Typography.Text>
              <Tag
                color={STATUS_TAG_COLORS[slot.status] || 'default'}
                style={{ margin: 0 }}
              >
                {slot.status}
              </Tag>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
