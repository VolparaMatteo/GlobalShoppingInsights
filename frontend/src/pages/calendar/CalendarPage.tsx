// ---------------------------------------------------------------------------
// CalendarPage.tsx  --  Editorial calendar main page
// ---------------------------------------------------------------------------
import React, { useCallback, useMemo, useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';

import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useCalendarStore, type CalendarViewMode } from '@/stores/calendarStore';
import { useCalendarSlots, useUpdateSlot } from '@/hooks/queries/useCalendarSlots';
import type { EditorialSlot } from '@/types';

import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import CalendarSidebar from './components/CalendarSidebar';
import SlotCard from './components/SlotCard';
import CollisionModal from './components/CollisionModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute the date range to query based on current view and date. */
function getDateRange(viewMode: CalendarViewMode, dateStr: string) {
  const d = dayjs(dateStr);
  switch (viewMode) {
    case 'month': {
      // Fetch from the start of the first displayed week to the end of the
      // last displayed week so the month grid can show leading/trailing days.
      const from = d.startOf('month').startOf('week').format('YYYY-MM-DD');
      const to = d.endOf('month').endOf('week').format('YYYY-MM-DD');
      return { from, to };
    }
    case 'week': {
      const from = d.startOf('week').format('YYYY-MM-DD');
      const to = d.endOf('week').format('YYYY-MM-DD');
      return { from, to };
    }
    case 'day': {
      const from = d.format('YYYY-MM-DD');
      const to = d.format('YYYY-MM-DD');
      return { from, to };
    }
  }
}

/** Navigate forward / backward depending on view mode. */
function navigate(dateStr: string, viewMode: CalendarViewMode, direction: 1 | -1) {
  const d = dayjs(dateStr);
  switch (viewMode) {
    case 'month':
      return d.add(direction, 'month').format('YYYY-MM-DD');
    case 'week':
      return d.add(direction, 'week').format('YYYY-MM-DD');
    case 'day':
      return d.add(direction, 'day').format('YYYY-MM-DD');
  }
}

/** Format the header label. */
function formatLabel(dateStr: string, viewMode: CalendarViewMode) {
  const d = dayjs(dateStr);
  switch (viewMode) {
    case 'month':
      return d.format('MMMM YYYY');
    case 'week':
      return `${d.startOf('week').format('MMM D')} - ${d.endOf('week').format('MMM D, YYYY')}`;
    case 'day':
      return d.format('dddd, MMMM D, YYYY');
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const viewMode = useCalendarStore((s) => s.viewMode);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setViewMode = useCalendarStore((s) => s.setViewMode);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const setDragState = useCalendarStore((s) => s.setDragState);

  const [activeSlot, setActiveSlot] = useState<EditorialSlot | null>(null);
  const [collisionOpen, setCollisionOpen] = useState(false);
  const [collisionData, setCollisionData] = useState<{
    existingSlots: EditorialSlot[];
    targetDate: string;
    slotId: number;
  } | null>(null);

  // --- Data fetching -------------------------------------------------------
  const dateRange = useMemo(
    () => getDateRange(viewMode, currentDate),
    [viewMode, currentDate],
  );

  const { data: slots = [], isLoading } = useCalendarSlots(dateRange);
  const updateSlot = useUpdateSlot();

  // --- Drag-and-drop -------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const slot = (slots as EditorialSlot[]).find(
        (s) => s.id === Number(event.active.id),
      );
      if (slot) {
        setActiveSlot(slot);
        setDragState({
          slotId: slot.id,
          originDate: slot.scheduled_for,
          isDragging: true,
        });
      }
    },
    [slots, setDragState],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveSlot(null);
      setDragState({ slotId: null, originDate: null, targetDate: null, isDragging: false });

      const { active, over } = event;
      if (!over) return;

      const slotId = Number(active.id);
      const targetDate = String(over.id); // droppable id is the date/datetime string

      // Optimistic: fire the mutation
      updateSlot.mutate({ id: slotId, data: { scheduled_for: targetDate } });
    },
    [setDragState, updateSlot],
  );

  const handleDragCancel = useCallback(() => {
    setActiveSlot(null);
    setDragState({ slotId: null, originDate: null, targetDate: null, isDragging: false });
  }, [setDragState]);

  // --- Navigation ----------------------------------------------------------
  const goPrev = () => setCurrentDate(navigate(currentDate, viewMode, -1));
  const goNext = () => setCurrentDate(navigate(currentDate, viewMode, 1));
  const goToday = () => setCurrentDate(dayjs().format('YYYY-MM-DD'));

  // --- Slot click handler --------------------------------------------------
  const handleSlotClick = useCallback((_slot: EditorialSlot) => {
    // Placeholder: open a detail / edit drawer in the future
  }, []);

  // --- View options --------------------------------------------------------
  const viewOptions: { label: string; value: CalendarViewMode }[] = [
    { label: 'Month', value: 'month' },
    { label: 'Week', value: 'week' },
    { label: 'Day', value: 'day' },
  ];

  // --- Render --------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Editorial Calendar"
        extra={
          <Space size="middle">
            <Space>
              <Button icon={<LeftOutlined />} onClick={goPrev} />
              <Button onClick={goToday}>Today</Button>
              <Button icon={<RightOutlined />} onClick={goNext} />
            </Space>
            <Typography.Text strong style={{ minWidth: 180, textAlign: 'center' }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              {formatLabel(currentDate, viewMode)}
            </Typography.Text>
            <Segmented
              options={viewOptions}
              value={viewMode}
              onChange={(val) => setViewMode(val as CalendarViewMode)}
            />
          </Space>
        }
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Sidebar */}
          <CalendarSidebar />

          {/* Main calendar area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <LoadingSpinner tip="Loading calendar..." />
            ) : (
              <>
                {viewMode === 'month' && (
                  <MonthView
                    slots={slots as EditorialSlot[]}
                    currentDate={currentDate}
                    onSlotClick={handleSlotClick}
                  />
                )}
                {viewMode === 'week' && (
                  <WeekView
                    slots={slots as EditorialSlot[]}
                    currentDate={currentDate}
                    onSlotClick={handleSlotClick}
                  />
                )}
                {viewMode === 'day' && (
                  <DayView
                    slots={slots as EditorialSlot[]}
                    currentDate={currentDate}
                    onSlotClick={handleSlotClick}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Drag overlay (ghost while dragging) */}
        <DragOverlay>
          {activeSlot ? <SlotCard slot={activeSlot} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Collision warning modal */}
      <CollisionModal
        open={collisionOpen}
        onOk={() => {
          setCollisionOpen(false);
          if (collisionData) {
            updateSlot.mutate({
              id: collisionData.slotId,
              data: { scheduled_for: collisionData.targetDate },
            });
          }
          setCollisionData(null);
        }}
        onCancel={() => {
          setCollisionOpen(false);
          setCollisionData(null);
        }}
        collisionData={collisionData}
      />
    </div>
  );
}
