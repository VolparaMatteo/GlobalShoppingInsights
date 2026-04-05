// ---------------------------------------------------------------------------
// CollisionModal.tsx  --  Modale di avviso per collisione nella pianificazione
// ---------------------------------------------------------------------------
import React from 'react';
import { Modal, Typography, List, Tag } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

import { STATUS_MAP } from '@/config/constants';
import type { EditorialSlot } from '@/types';

dayjs.locale('it');

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
// Status tag colours
// ---------------------------------------------------------------------------

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
  const formattedDate = dayjs(targetDate)
    .format('dddd D MMMM YYYY')
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <Modal
      open={open}
      title={
        <span>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Collisione di pianificazione
        </span>
      }
      okText="Pianifica comunque"
      okButtonProps={{ danger: true }}
      cancelText="Annulla"
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Typography.Paragraph>
        {existingSlots.length === 1 ? "C'è già" : 'Ci sono già'}{' '}
        <strong>{existingSlots.length}</strong>{' '}
        slot pianificat{existingSlots.length !== 1 ? 'i' : 'o'} per il{' '}
        <strong>{formattedDate}</strong>. Aggiungerne un altro potrebbe superare
        il limite di pubblicazione giornaliero.
      </Typography.Paragraph>

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Slot esistenti per questo giorno:
      </Typography.Text>

      <List
        size="small"
        bordered
        dataSource={existingSlots}
        renderItem={(slot) => (
          <List.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
              <Typography.Text style={{ flex: 1 }} ellipsis>
                {slot.article_title || `Slot #${slot.id}`}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                {dayjs(slot.scheduled_for).format('HH:mm')}
              </Typography.Text>
              <Tag
                color={SLOT_TAG_COLORS[slot.status] || 'default'}
                style={{ margin: 0 }}
              >
                {getStatusLabel(slot.status)}
              </Tag>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
}
