// ---------------------------------------------------------------------------
// CalendarPage — Sprint 7 polish b15 (premium hero + toolbar + Lucide)
// DnD, viste e modali preservati.
// ---------------------------------------------------------------------------
import { useCallback, useMemo, useState } from 'react';

import { Button, Segmented, Space, Typography, theme as antdTheme } from 'antd';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import {
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useArticle } from '@/hooks/queries/useArticle';
import { useCalendarSlots, useUpdateSlot } from '@/hooks/queries/useCalendarSlots';
import ArticlePreviewDrawer from '@/pages/inbox/components/ArticlePreviewDrawer';
import { useCalendarStore, type CalendarViewMode } from '@/stores/calendarStore';
import type { Article, EditorialSlot } from '@/types';

import CalendarSidebar from './components/CalendarSidebar';
import CollisionModal from './components/CollisionModal';
import DayView from './components/DayView';
import MonthView from './components/MonthView';
import ScheduleModal from './components/ScheduleModal';
import SlotCard from './components/SlotCard';
import WeekView from './components/WeekView';

dayjs.locale('it');

const { Title, Text } = Typography;

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
  const { token } = antdTheme.useToken();

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

  // Article preview drawer state
  const [previewArticleId, setPreviewArticleId] = useState<number | null>(null);
  const { data: previewArticle } = useArticle(previewArticleId ?? 0);

  // Data fetching
  const dateRange = useMemo(() => getDateRange(viewMode, currentDate), [viewMode, currentDate]);
  const { data: slots = [], isLoading } = useCalendarSlots(dateRange);
  const updateSlot = useUpdateSlot();

  // Drag-and-drop
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const idStr = String(event.active.id);
      if (idStr.startsWith('article-')) {
        const article = event.active.data.current?.article as Article | undefined;
        if (article) {
          setDraggingArticle(article);
          setDragState({ slotId: null, originDate: null, isDragging: true });
        }
      } else {
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
        const article = active.data.current?.article as Article | undefined;
        if (article) {
          setScheduleModal({
            articleId: article.id,
            articleTitle: article.title,
            scheduledFor: targetDate,
          });
        }
      } else {
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

  // Navigation
  const goPrev = () => setCurrentDate(navigate(currentDate, viewMode, -1));
  const goNext = () => setCurrentDate(navigate(currentDate, viewMode, 1));
  const goToday = () => setCurrentDate(dayjs().format('YYYY-MM-DD'));

  const handleSlotClick = useCallback((slot: EditorialSlot) => {
    if (slot.article_id) {
      setPreviewArticleId(slot.article_id);
    }
  }, []);

  const viewOptions = [
    {
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <CalendarDays size={13} />
          Mese
        </span>
      ),
      value: 'month' as CalendarViewMode,
    },
    {
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <CalendarRange size={13} />
          Settimana
        </span>
      ),
      value: 'week' as CalendarViewMode,
    },
    {
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} />
          Giorno
        </span>
      ),
      value: 'day' as CalendarViewMode,
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)',
            border: `1px solid ${token.colorPrimary}33`,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <CalendarIcon size={22} strokeWidth={2} />
        </div>
        <div>
          <Title
            level={3}
            style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: token.colorText }}
          >
            Calendario editoriale
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Trascina articoli approvati negli slot per pianificarne la pubblicazione.
          </Text>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: '10px 14px',
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <Space size={4}>
          <Button
            icon={<ChevronLeft size={15} />}
            onClick={goPrev}
            aria-label="Periodo precedente"
            style={{ borderRadius: 8, height: 34, width: 34, padding: 0 }}
          />
          <Button
            onClick={goToday}
            style={{ borderRadius: 8, height: 34, fontWeight: 500, padding: '0 14px' }}
          >
            Oggi
          </Button>
          <Button
            icon={<ChevronRight size={15} />}
            onClick={goNext}
            aria-label="Periodo successivo"
            style={{ borderRadius: 8, height: 34, width: 34, padding: 0 }}
          />
        </Space>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: token.colorText,
            letterSpacing: -0.2,
            minWidth: 180,
          }}
        >
          {formatLabel(currentDate, viewMode)}
        </div>

        <div style={{ flex: 1 }} />

        <Segmented
          options={viewOptions}
          value={viewMode}
          onChange={(val) => setViewMode(val as CalendarViewMode)}
        />
      </div>

      {/* DnD layout */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
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
                padding: '10px 14px',
                background: token.colorBgElevated,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 10,
                boxShadow: '0 12px 32px -8px rgba(22,119,255,0.35)',
                maxWidth: 260,
                fontSize: 13,
                fontWeight: 500,
                color: token.colorText,
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
