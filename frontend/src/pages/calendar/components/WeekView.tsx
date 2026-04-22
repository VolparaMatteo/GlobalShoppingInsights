// ---------------------------------------------------------------------------
// WeekView.tsx  --  Vista settimanale con griglia oraria
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

interface WeekViewProps {
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

function buildWeekDays(dateStr: string): Dayjs[] {
  const start = dayjs(dateStr).startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

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
  gridTemplateColumns: '60px repeat(7, 1fr)',
  border: '1px solid #e8e8e8',
  borderRadius: 12,
  overflow: 'auto',
  maxHeight: 'calc(100vh - 220px)',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const dayHeaderStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: '#fafafa',
  padding: '10px 4px',
  textAlign: 'center',
  fontWeight: 600,
  fontSize: 13,
  borderBottom: '1px solid #e8e8e8',
  borderRight: '1px solid #f0f0f0',
  color: '#595959',
};

const hourLabelStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 11,
  color: '#8c8c8c',
  textAlign: 'right',
  borderRight: '1px solid #f0f0f0',
  borderBottom: '1px solid #f0f0f0',
  minHeight: 60,
};

const cellStyle: React.CSSProperties = {
  minHeight: 60,
  padding: 3,
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
      {/* Angolo in alto a sinistra (vuoto) */}
      <div style={{ ...dayHeaderStyle, background: '#fafafa' }} />

      {/* Header colonne giorno */}
      {days.map((day) => {
        const dateKey = day.format('YYYY-MM-DD');
        const isToday = dateKey === today;
        return (
          <div
            key={dateKey}
            style={{
              ...dayHeaderStyle,
              background: isToday ? '#e6f4ff' : '#fafafa',
              color: isToday ? '#1677ff' : '#595959',
            }}
          >
            <div>{day.format('ddd').replace(/^./, (c) => c.toUpperCase())}</div>
            <Typography.Text
              strong={isToday}
              style={{ fontSize: 12, color: isToday ? '#1677ff' : '#8c8c8c' }}
            >
              {day.format('DD/MM')}
            </Typography.Text>
          </div>
        );
      })}

      {/* Righe orarie */}
      {HOURS.map((hour) => (
        <React.Fragment key={hour}>
          <div style={hourLabelStyle}>{String(hour).padStart(2, '0')}:00</div>

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
                    <SlotCard key={slot.id} slot={slot} onClick={() => onSlotClick(slot)} />
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
