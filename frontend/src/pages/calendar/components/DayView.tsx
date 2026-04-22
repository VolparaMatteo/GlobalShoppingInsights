// ---------------------------------------------------------------------------
// DayView.tsx  --  Vista giornaliera con griglia oraria
// ---------------------------------------------------------------------------
import React, { useMemo } from 'react';
import { Typography, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

import type { EditorialSlot } from '@/types';
import SlotCard from './SlotCard';
import DroppableSlot from './DroppableSlot';

dayjs.locale('it');

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DayViewProps {
  slots: EditorialSlot[];
  currentDate: string;
  onSlotClick: (slot: EditorialSlot) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByHour(slots: EditorialSlot[], dateStr: string): Record<number, EditorialSlot[]> {
  const map: Record<number, EditorialSlot[]> = {};
  for (const s of slots) {
    const d = dayjs(s.scheduled_for);
    if (d.format('YYYY-MM-DD') !== dateStr) continue;
    const h = d.hour();
    (map[h] ||= []).push(s);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  overflow: 'auto',
  maxHeight: 'calc(100vh - 220px)',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: '#fafafa',
  padding: '14px 16px',
  borderBottom: '1px solid #e8e8e8',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '80px 1fr',
  borderBottom: '1px solid #f0f0f0',
  minHeight: 72,
};

const hourLabelStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 12,
  color: '#8c8c8c',
  textAlign: 'right',
  borderRight: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
};

const cellStyle: React.CSSProperties = {
  padding: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DayView({ slots, currentDate, onSlotClick }: DayViewProps) {
  const grouped = useMemo(() => groupByHour(slots, currentDate), [slots, currentDate]);

  const isToday = dayjs().format('YYYY-MM-DD') === currentDate;
  const currentHour = dayjs().hour();

  const dateLabel = dayjs(currentDate)
    .format('dddd D MMMM YYYY')
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <div style={containerStyle}>
      {/* Header giorno */}
      <div style={headerStyle}>
        <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
        <Typography.Text strong style={{ fontSize: 14 }}>
          {dateLabel}
        </Typography.Text>
        {isToday && <Tag color="blue">Oggi</Tag>}
        <Typography.Text type="secondary" style={{ marginLeft: 'auto', fontSize: 13 }}>
          {slots.length} slot pianificat{slots.length !== 1 ? 'i' : 'o'}
        </Typography.Text>
      </div>

      {/* Righe orarie */}
      {HOURS.map((hour) => {
        const hourSlots = grouped[hour] || [];
        const droppableId = `${currentDate}T${String(hour).padStart(2, '0')}:00:00`;
        const isCurrentHour = isToday && hour === currentHour;

        return (
          <DroppableSlot key={droppableId} id={droppableId} date={currentDate}>
            <div
              style={{
                ...rowStyle,
                background: isCurrentHour ? '#e6f4ff' : '#fff',
              }}
            >
              <div style={hourLabelStyle}>
                <Typography.Text
                  type="secondary"
                  style={{
                    fontWeight: isCurrentHour ? 600 : 400,
                    color: isCurrentHour ? '#1677ff' : undefined,
                  }}
                >
                  {String(hour).padStart(2, '0')}:00
                </Typography.Text>
              </div>

              <div style={cellStyle}>
                {hourSlots.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} detailed onClick={() => onSlotClick(slot)} />
                ))}
              </div>
            </div>
          </DroppableSlot>
        );
      })}
    </div>
  );
}
