// ---------------------------------------------------------------------------
// WeekView.tsx  --  7-column week view with hour axis
// ---------------------------------------------------------------------------
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

import type { EditorialSlot } from '@/types';
import SlotCard from './SlotCard';
import DroppableSlot from './DroppableSlot';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WeekViewProps {
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

/** Build the 7 days of the week containing `dateStr`. */
function buildWeekDays(dateStr: string): Dayjs[] {
  const start = dayjs(dateStr).startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

/** Group slots by a "date|hour" key. */
function groupByDateHour(slots: EditorialSlot[]): Record<string, EditorialSlot[]> {
  const map: Record<string, EditorialSlot[]> = {};
  for (const s of slots) {
    const d = dayjs(s.scheduled_for);
    const key = `${d.format('YYYY-MM-DD')}|${d.hour()}`;
    (map[key] ||= []).push(s);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'grid',
  // 1 narrow column for hour labels + 7 day columns
  gridTemplateColumns: '60px repeat(7, 1fr)',
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  overflow: 'auto',
  maxHeight: 'calc(100vh - 220px)',
};

const dayHeaderStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: '#fafafa',
  padding: '8px 4px',
  textAlign: 'center',
  fontWeight: 600,
  borderBottom: '1px solid #f0f0f0',
  borderRight: '1px solid #f0f0f0',
};

const hourLabelStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 11,
  color: '#999',
  textAlign: 'right',
  borderRight: '1px solid #f0f0f0',
  borderBottom: '1px solid #f0f0f0',
  minHeight: 60,
};

const cellStyle: React.CSSProperties = {
  minHeight: 60,
  padding: 2,
  borderRight: '1px solid #f0f0f0',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeekView({ slots, currentDate, onSlotClick }: WeekViewProps) {
  const days = useMemo(() => buildWeekDays(currentDate), [currentDate]);
  const grouped = useMemo(() => groupByDateHour(slots), [slots]);
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <div style={containerStyle}>
      {/* Top-left corner (empty) */}
      <div style={{ ...dayHeaderStyle, background: '#fafafa' }} />

      {/* Day column headers */}
      {days.map((day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const isToday = dateKey === today;
        return (
          <div
            key={dateKey}
            style={{
              ...dayHeaderStyle,
              background: isToday ? '#e6f4ff' : '#fafafa',
            }}
          >
            <Typography.Text strong={isToday}>
              {day.format('ddd M/D')}
            </Typography.Text>
          </div>
        );
      })}

      {/* Hour rows */}
      {HOURS.map((hour) => (
        <React.Fragment key={hour}>
          {/* Hour label */}
          <div style={hourLabelStyle}>
            {dayjs().hour(hour).minute(0).format('h:mm A')}
          </div>

          {/* Day cells within this hour */}
          {days.map((day) => {
            const dateKey = day.format('YYYY-MM-DD');
            const groupKey = `${dateKey}|${hour}`;
            const hourSlots = grouped[groupKey] || [];
            const droppableId = `${dateKey}T${String(hour).padStart(2, '0')}:00:00`;

            return (
              <DroppableSlot key={droppableId} id={droppableId} date={dateKey}>
                <div
                  style={{
                    ...cellStyle,
                    background: dateKey === today ? '#f0f7ff' : '#fff',
                  }}
                >
                  {hourSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onClick={() => onSlotClick(slot)}
                    />
                  ))}
                </div>
              </DroppableSlot>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
