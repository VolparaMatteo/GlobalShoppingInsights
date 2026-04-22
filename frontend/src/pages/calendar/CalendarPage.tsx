// ---------------------------------------------------------------------------
// CalendarPage.tsx  --  Calendario editoriale
// ---------------------------------------------------------------------------
import React, { useCallback, useMemo, useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
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
import 'dayjs/locale/it';

import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useCalendarStore, type CalendarViewMode } from '@/stores/calendarStore';
import { useCalendarSlots, useUpdateSlot } from '@/hooks/queries/useCalendarSlots';
import { useArticle } from '@/hooks/queries/useArticle';
import type { Article, EditorialSlot } from '@/types';

import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import CalendarSidebar from './components/CalendarSidebar';
import SlotCard from './components/SlotCard';
import CollisionModal from './components/CollisionModal';
import ScheduleModal from './components/ScheduleModal';
import ArticlePreviewDrawer from '@/pages/inbox/components/ArticlePreviewDrawer';

dayjs.locale('it');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateRange(viewMode: CalendarViewMode, dateStr: string) {
  const d = dayjs(dateStr);
  switch (viewMode) {
    case 'month': {
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

function formatLabel(dateStr: string, viewMode: CalendarViewMode) {
  const d = dayjs(dateStr);
  switch (viewMode) {
    case 'month':
      // "Febbraio 2026" — capitalize first letter
      return d.format('MMMM YYYY').replace(/^./, (c) => c.toUpperCase());
    case 'week': {
      const start = d.startOf('week');
      const end = d.endOf('week');
      return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`;
    }
    case 'day':
      return d.format('dddd D MMMM YYYY').replace(/^./, (c) => c.toUpperCase());
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
  const [draggingArticle, setDraggingArticle] = useState<Article | null>(null);
  const [collisionOpen, setCollisionOpen] = useState(false);
  const [collisionData, setCollisionData] = useState<{
    existingSlots: EditorialSlot[];
    targetDate: string;
    slotId: number;
  } | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{
    articleId: number;
    articleTitle: string;
    scheduledFor: string;
  } | null>(null);

  // --- Article preview drawer state ----------------------------------------
  const [previewArticleId, setPreviewArticleId] = useState<number | null>(null);
  const { data: previewArticle } = useArticle(previewArticleId ?? 0);

  // --- Data fetching -------------------------------------------------------
  const dateRange = useMemo(() => getDateRange(viewMode, currentDate), [viewMode, currentDate]);

  const { data: slots = [], isLoading } = useCalendarSlots(dateRange);
  const updateSlot = useUpdateSlot();

  // --- Drag-and-drop -------------------------------------------------------
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const idStr = String(event.active.id);
      if (idStr.startsWith('article-')) {
        // Dragging from the sidebar
        const article = event.active.data.current?.article as Article | undefined;
        if (article) {
          setDraggingArticle(article);
          setDragState({ slotId: null, originDate: null, isDragging: true });
        }
      } else {
        // Dragging an existing slot (block published/failed)
        const slot = (slots as EditorialSlot[]).find((s) => s.id === Number(idStr));
        if (slot && slot.status !== 'published' && slot.status !== 'failed') {
          setActiveSlot(slot);
          setDragState({
            slotId: slot.id,
            originDate: slot.scheduled_for,
            isDragging: true,
          });
        }
      }
    },
    [slots, setDragState],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveSlot(null);
      setDraggingArticle(null);
      setDragState({ slotId: null, originDate: null, targetDate: null, isDragging: false });

      const { active, over } = event;
      if (!over) return;

      const idStr = String(active.id);
      const targetDate = String(over.id);

      if (idStr.startsWith('article-')) {
        // Article dropped from sidebar → open ScheduleModal
        const article = active.data.current?.article as Article | undefined;
        if (article) {
          setScheduleModal({
            articleId: article.id,
            articleTitle: article.title,
            scheduledFor: targetDate,
          });
        }
      } else {
        // Existing slot moved
        const slotId = Number(idStr);
        updateSlot.mutate({ id: slotId, data: { scheduled_for: targetDate } });
      }
    },
    [setDragState, updateSlot],
  );

  const handleDragCancel = useCallback(() => {
    setActiveSlot(null);
    setDraggingArticle(null);
    setDragState({ slotId: null, originDate: null, targetDate: null, isDragging: false });
  }, [setDragState]);

  // --- Navigation ----------------------------------------------------------
  const goPrev = () => setCurrentDate(navigate(currentDate, viewMode, -1));
  const goNext = () => setCurrentDate(navigate(currentDate, viewMode, 1));
  const goToday = () => setCurrentDate(dayjs().format('YYYY-MM-DD'));

  // --- Slot click handler --------------------------------------------------
  const handleSlotClick = useCallback((slot: EditorialSlot) => {
    if (slot.article_id) {
      setPreviewArticleId(slot.article_id);
    }
  }, []);

  // --- View options --------------------------------------------------------
  const viewOptions: { label: string; value: CalendarViewMode }[] = [
    { label: 'Mese', value: 'month' },
    { label: 'Settimana', value: 'week' },
    { label: 'Giorno', value: 'day' },
  ];

  // --- Render --------------------------------------------------------------
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Calendario Editoriale"
        extra={
          <Space size="middle" wrap>
            <Space>
              <Button icon={<LeftOutlined />} onClick={goPrev} />
              <Button onClick={goToday}>Oggi</Button>
              <Button icon={<RightOutlined />} onClick={goNext} />
            </Space>
            <Typography.Text strong style={{ minWidth: 200, textAlign: 'center', fontSize: 15 }}>
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
          <CalendarSidebar />

          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <LoadingSpinner tip="Caricamento calendario..." />
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

        <DragOverlay>
          {activeSlot ? (
            <SlotCard slot={activeSlot} overlay />
          ) : draggingArticle ? (
            <div
              style={{
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: 240,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {draggingArticle.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

      {scheduleModal && (
        <ScheduleModal
          open
          onClose={() => setScheduleModal(null)}
          articleId={scheduleModal.articleId}
          articleTitle={scheduleModal.articleTitle}
          defaultDate={dayjs(scheduleModal.scheduledFor)}
          defaultTime={dayjs(scheduleModal.scheduledFor)}
        />
      )}

      <ArticlePreviewDrawer
        article={previewArticle ?? null}
        open={previewArticleId !== null}
        onClose={() => setPreviewArticleId(null)}
        readOnly
      />
    </div>
  );
}
