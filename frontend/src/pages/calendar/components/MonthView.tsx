// ---------------------------------------------------------------------------
// MonthView.tsx  --  Griglia mensile del calendario
// ---------------------------------------------------------------------------
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/it';

import type { EditorialSlot } from '@/types';
import SlotCard from './SlotCard';
import DroppableSlot from './DroppableSlot';

dayjs.locale('it');

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MonthViewProps {
  slots: EditorialSlot[];
  currentDate: string;
  onSlotClick: (slot: EditorialSlot) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

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
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const headerCellStyle: React.CSSProperties = {
  padding: '10px 4px',
  textAlign: 'center',
  fontWeight: 600,
  fontSize: 13,
  background: '#fafafa',
  borderBottom: '1px solid #e8e8e8',
  color: '#595959',
};

const baseCellStyle: React.CSSProperties = {
  minHeight: 110,
  padding: 6,
  borderRight: '1px solid #f0f0f0',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
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
      {/* Header giorni della settimana */}
      {WEEKDAYS.map((wd) => (
        <div key={wd} style={headerCellStyle}>
          {wd}
        </div>
      ))}

      {/* Celle giorno */}
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
                  opacity: isOutside ? 0.45 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Typography.Text
                    strong={isToday}
                    style={{
                      fontSize: 12,
                      color: isToday ? '#1677ff' : isOutside ? '#bfbfbf' : '#595959',
                      width: 22,
                      height: 22,
                      lineHeight: '22px',
                      textAlign: 'center',
                      borderRadius: '50%',
                      background: isToday ? '#1677ff' : 'transparent',
                      ...(isToday ? { color: '#fff' } : {}),
                    }}
                  >
                    {day.date()}
                  </Typography.Text>
                  {daySlots.length > 0 && !isOutside && (
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                      {daySlots.length} slot
                    </Typography.Text>
                  )}
                </div>

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
