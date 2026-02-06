// ---------------------------------------------------------------------------
// MonthView.tsx  --  Month grid calendar view
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

interface MonthViewProps {
  slots: EditorialSlot[];
  currentDate: string; // YYYY-MM-DD
  onSlotClick: (slot: EditorialSlot) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build a 6-row x 7-col matrix of Dayjs dates covering the month grid. */
function buildMonthGrid(dateStr: string): Dayjs[][] {
  const d = dayjs(dateStr);
  const start = d.startOf('month').startOf('week');
  const weeks: Dayjs[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: Dayjs[] = [];
    for (let dow = 0; dow < 7; dow++) {
      week.push(start.add(w * 7 + dow, 'day'));
    }
    weeks.push(week);
  }
  return weeks;
}

/** Group slots by date string (YYYY-MM-DD). */
function groupByDate(slots: EditorialSlot[]): Record<string, EditorialSlot[]> {
  const map: Record<string, EditorialSlot[]> = {};
  for (const s of slots) {
    const key = dayjs(s.scheduled_for).format('YYYY-MM-DD');
    (map[key] ||= []).push(s);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  overflow: 'hidden',
};

const headerCellStyle: React.CSSProperties = {
  padding: '8px 4px',
  textAlign: 'center',
  fontWeight: 600,
  background: '#fafafa',
  borderBottom: '1px solid #f0f0f0',
};

const baseCellStyle: React.CSSProperties = {
  minHeight: 100,
  padding: 4,
  borderRight: '1px solid #f0f0f0',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MonthView({ slots, currentDate, onSlotClick }: MonthViewProps) {
  const weeks = useMemo(() => buildMonthGrid(currentDate), [currentDate]);
  const grouped = useMemo(() => groupByDate(slots), [slots]);

  const today = dayjs().format('YYYY-MM-DD');
  const currentMonth = dayjs(currentDate).month();

  return (
    <div style={gridStyle}>
      {/* Weekday header row */}
      {WEEKDAYS.map((wd) => (
        <div key={wd} style={headerCellStyle}>
          <Typography.Text strong>{wd}</Typography.Text>
        </div>
      ))}

      {/* Day cells */}
      {weeks.map((week) =>
        week.map((day) => {
          const dateKey = day.format('YYYY-MM-DD');
          const isToday = dateKey === today;
          const isOutside = day.month() !== currentMonth;
          const daySlots = grouped[dateKey] || [];

          return (
            <DroppableSlot key={dateKey} id={dateKey} date={dateKey}>
              <div
                style={{
                  ...baseCellStyle,
                  background: isToday
                    ? '#e6f4ff'
                    : isOutside
                      ? '#fafafa'
                      : '#fff',
                  opacity: isOutside ? 0.5 : 1,
                }}
              >
                <Typography.Text
                  strong={isToday}
                  style={{
                    fontSize: 12,
                    color: isToday ? '#1677ff' : undefined,
                    marginBottom: 2,
                  }}
                >
                  {day.date()}
                </Typography.Text>

                {daySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onClick={() => onSlotClick(slot)}
                  />
                ))}
              </div>
            </DroppableSlot>
          );
        }),
      )}
    </div>
  );
}
