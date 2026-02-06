// ---------------------------------------------------------------------------
// DayView.tsx  --  Single-day hourly view
// ---------------------------------------------------------------------------
import React, { useMemo } from 'react';
import { Typography, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { EditorialSlot } from '@/types';
import SlotCard from './SlotCard';
import DroppableSlot from './DroppableSlot';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DayViewProps {
  slots: EditorialSlot[];
  currentDate: string; // YYYY-MM-DD
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

/** Group slots by hour within the given day. */
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
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  overflow: 'auto',
  maxHeight: 'calc(100vh - 220px)',
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: '#fafafa',
  padding: '12px 16px',
  borderBottom: '1px solid #f0f0f0',
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
  color: '#999',
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

  return (
    <div style={containerStyle}>
      {/* Day header */}
      <div style={headerStyle}>
        <ClockCircleOutlined />
        <Typography.Text strong>
          {dayjs(currentDate).format('dddd, MMMM D, YYYY')}
        </Typography.Text>
        {isToday && <Tag color="blue">Today</Tag>}
        <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
          {slots.length} slot{slots.length !== 1 ? 's' : ''} scheduled
        </Typography.Text>
      </div>

      {/* Hourly rows */}
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
                  {dayjs().hour(hour).minute(0).format('h:mm A')}
                </Typography.Text>
              </div>

              <div style={cellStyle}>
                {hourSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    detailed
                    onClick={() => onSlotClick(slot)}
                  />
                ))}
              </div>
            </div>
          </DroppableSlot>
        );
      })}
    </div>
  );
}
