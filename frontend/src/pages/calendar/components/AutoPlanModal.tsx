// ---------------------------------------------------------------------------
// AutoPlanModal.tsx
//
// Pianificazione automatica della settimana editoriale.
// Flusso:
//   1) Form (categoria, settimana, ora, target min/g, strategia)
//   2) "Genera anteprima" → POST /slots/auto-plan?dry_run=true
//   3) Anteprima 7-giorni con stats, eventuale banner di collisione
//   4) "Conferma e crea" → POST /slots/auto-plan?dry_run=false
//
// L'algoritmo backend ordina per ai_score DESC e bilancia il carico.
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  DatePicker,
  Empty,
  InputNumber,
  Modal,
  Segmented,
  Select,
  TimePicker,
  Typography,
  theme as antdTheme,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/it';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { ARTICLE_CATEGORIES } from '@/config/constants';
import { useAutoPlanWeek } from '@/hooks/queries/useCalendarSlots';
import { useToast } from '@/hooks/useToast';
import type {
  AutoPlanCollisionStrategy,
  AutoPlanRequest,
  AutoPlanResponse,
  AutoPlanStrategy,
} from '@/types';

dayjs.extend(isoWeek);
dayjs.locale('it');

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfIsoWeek(d: Dayjs): Dayjs {
  // ISO 8601: lunedì = 1.
  return d.isoWeekday(1).startOf('day');
}

function formatWeekLabel(monday: Dayjs): string {
  const sunday = monday.add(6, 'day');
  return `${monday.format('D MMM')} – ${sunday.format('D MMM YYYY')}`;
}

function dayLabel(iso: string): string {
  const d = dayjs(iso);
  const name = d.format('dddd');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${d.format('D MMM')}`;
}

function categoryColor(name: string): string {
  return ARTICLE_CATEGORIES.find((c) => c.name === name)?.color ?? '#1677ff';
}

function categoryIcon(name: string): string {
  return ARTICLE_CATEGORIES.find((c) => c.name === name)?.icon ?? '📁';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AutoPlanModalProps {
  open: boolean;
  onClose: () => void;
  initialWeek?: Dayjs;
}

export default function AutoPlanModal({ open, onClose, initialWeek }: AutoPlanModalProps) {
  const { token } = antdTheme.useToken();
  const toast = useToast();
  const autoPlan = useAutoPlanWeek();

  // --- Form state ---
  const [category, setCategory] = useState<string>(ARTICLE_CATEGORIES[0]?.name ?? '');
  const [week, setWeek] = useState<Dayjs>(() => startOfIsoWeek(initialWeek ?? dayjs()));
  const [publishTime, setPublishTime] = useState<Dayjs>(dayjs().hour(9).minute(0).second(0));
  const [targetMinPerDay, setTargetMinPerDay] = useState<number>(15);
  const [strategy, setStrategy] = useState<AutoPlanStrategy>('spread');
  const [collisionStrategy, setCollisionStrategy] =
    useState<AutoPlanCollisionStrategy>('integrate');

  // --- Preview state ---
  const [preview, setPreview] = useState<AutoPlanResponse | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Reset stato quando il modal si chiude/riapre
  useEffect(() => {
    if (open) {
      setShowForm(true);
      setPreview(null);
      setWeek(startOfIsoWeek(initialWeek ?? dayjs()));
    }
  }, [open, initialWeek]);

  // --- Mutations ---
  const buildPayload = (dryRun: boolean): AutoPlanRequest => ({
    category,
    week_start: week.format('YYYY-MM-DD'),
    publish_time: publishTime.format('HH:mm:ss'),
    target_min_per_day: targetMinPerDay,
    strategy,
    collision_strategy: collisionStrategy,
    dry_run: dryRun,
  });

  const handleGeneratePreview = () => {
    autoPlan.mutate(buildPayload(true), {
      onSuccess: (data) => {
        setPreview(data);
        setShowForm(false);
        if (data.summary.collision_detected && collisionStrategy === 'integrate') {
          // L'utente può cambiare strategia poi rigenerare l'anteprima.
        }
      },
      onError: (err) => toast.error(err),
    });
  };

  const handleConfirm = () => {
    autoPlan.mutate(buildPayload(false), {
      onSuccess: (data) => {
        toast.success(`Piano creato: ${data.created_slot_ids.length} slot pianificati`);
        onClose();
      },
      onError: (err) => toast.error(err),
    });
  };

  const handleEditFilters = () => {
    setShowForm(true);
  };

  // --- UI ---
  const cellMinWidth = 240;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      title={null}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      {/* Hero header brand-gradient */}
      <div
        style={{
          padding: '24px 28px 22px',
          background:
            'linear-gradient(135deg, rgba(22,119,255,0.10) 0%, rgba(114,46,209,0.10) 100%)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 24px -6px rgba(114,46,209,0.45)',
            }}
          >
            <Wand2 size={22} strokeWidth={2.2} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3 }}>
              Pianifica con AI
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Genera automaticamente un piano editoriale settimanale dagli articoli approvati.
            </Text>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 28px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
        {showForm && (
          <FormSection
            category={category}
            setCategory={setCategory}
            week={week}
            setWeek={setWeek}
            publishTime={publishTime}
            setPublishTime={setPublishTime}
            targetMinPerDay={targetMinPerDay}
            setTargetMinPerDay={setTargetMinPerDay}
            strategy={strategy}
            setStrategy={setStrategy}
          />
        )}

        {!showForm && preview && (
          <PreviewSection
            preview={preview}
            collisionStrategy={collisionStrategy}
            setCollisionStrategy={setCollisionStrategy}
            cellMinWidth={cellMinWidth}
            categoryName={category}
            onRegenerate={handleGeneratePreview}
            isRegenerating={autoPlan.isPending}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 28px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        {!showForm && preview && (
          <Button
            type="text"
            icon={<ArrowLeft size={14} />}
            onClick={handleEditFilters}
            style={{ borderRadius: 8, color: token.colorTextSecondary }}
          >
            Modifica filtri
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>
          Annulla
        </Button>
        {showForm ? (
          <Button
            type="primary"
            icon={<Sparkles size={14} />}
            loading={autoPlan.isPending}
            onClick={handleGeneratePreview}
            disabled={!category || targetMinPerDay <= 0}
            style={{
              borderRadius: 8,
              height: 36,
              fontWeight: 600,
              padding: '0 18px',
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              border: 'none',
              boxShadow: '0 4px 12px -2px rgba(114,46,209,0.35)',
            }}
          >
            Genera anteprima
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<CheckCircle2 size={14} />}
            loading={autoPlan.isPending}
            onClick={handleConfirm}
            disabled={!preview || preview.summary.articles_planned === 0}
            style={{
              borderRadius: 8,
              height: 36,
              fontWeight: 600,
              padding: '0 18px',
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              border: 'none',
              boxShadow: '0 4px 12px -2px rgba(114,46,209,0.35)',
            }}
          >
            Conferma e crea
          </Button>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// FormSection
// ---------------------------------------------------------------------------

interface FormSectionProps {
  category: string;
  setCategory: (v: string) => void;
  week: Dayjs;
  setWeek: (v: Dayjs) => void;
  publishTime: Dayjs;
  setPublishTime: (v: Dayjs) => void;
  targetMinPerDay: number;
  setTargetMinPerDay: (v: number) => void;
  strategy: AutoPlanStrategy;
  setStrategy: (v: AutoPlanStrategy) => void;
}

function FormSection({
  category,
  setCategory,
  week,
  setWeek,
  publishTime,
  setPublishTime,
  targetMinPerDay,
  setTargetMinPerDay,
  strategy,
  setStrategy,
}: FormSectionProps) {
  const { token } = antdTheme.useToken();

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 600,
    color: token.colorTextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const categoryOptions = useMemo(
    () =>
      ARTICLE_CATEGORIES.map((c) => ({
        value: c.name,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>{c.icon}</span>
            <span style={{ fontWeight: 500 }}>{c.name}</span>
          </span>
        ),
      })),
    [],
  );

  const strategyOptions = [
    {
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
          <Clock size={13} />
          Rispetta target
        </span>
      ),
      value: 'cap',
    },
    {
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
          <Layers size={13} />
          Usa tutto disponibile
        </span>
      ),
      value: 'spread',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
      }}
    >
      {/* Categoria */}
      <div style={{ gridColumn: '1 / span 2' }}>
        <label style={fieldLabel}>Macrocategoria</label>
        <Select
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          style={{ width: '100%' }}
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 6 }}>
          Solo articoli <strong>approvati</strong> della categoria selezionata vengono inclusi nel
          pool.
        </Text>
      </div>

      {/* Settimana */}
      <div>
        <label style={fieldLabel}>Settimana (lunedì)</label>
        <DatePicker
          value={week}
          onChange={(d) => d && setWeek(startOfIsoWeek(d))}
          format={(d) => `${formatWeekLabel(d)}`}
          allowClear={false}
          size="large"
          style={{ width: '100%' }}
          picker="week"
        />
      </div>

      {/* Orario */}
      <div>
        <label style={fieldLabel}>Orario di pubblicazione</label>
        <TimePicker
          value={publishTime}
          onChange={(t) => t && setPublishTime(t)}
          format="HH:mm"
          minuteStep={15}
          allowClear={false}
          size="large"
          style={{ width: '100%' }}
        />
      </div>

      {/* Target */}
      <div>
        <label style={fieldLabel}>Target lettura medio (min/giorno)</label>
        <InputNumber
          value={targetMinPerDay}
          onChange={(v) => setTargetMinPerDay(typeof v === 'number' ? v : 15)}
          min={1}
          max={600}
          step={5}
          size="large"
          style={{ width: '100%' }}
          addonAfter="min"
        />
      </div>

      {/* Strategia */}
      <div>
        <label style={fieldLabel}>Strategia</label>
        <Segmented
          options={strategyOptions}
          value={strategy}
          onChange={(v) => setStrategy(v as AutoPlanStrategy)}
          block
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 6 }}>
          {strategy === 'cap'
            ? 'Riempi i giorni senza superare il target. Articoli in eccesso restano disponibili.'
            : 'Distribuisci tutti gli articoli del pool, anche se sforano il target.'}
        </Text>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PreviewSection
// ---------------------------------------------------------------------------

interface PreviewSectionProps {
  preview: AutoPlanResponse;
  collisionStrategy: AutoPlanCollisionStrategy;
  setCollisionStrategy: (s: AutoPlanCollisionStrategy) => void;
  cellMinWidth: number;
  categoryName: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function PreviewSection({
  preview,
  collisionStrategy,
  setCollisionStrategy,
  cellMinWidth,
  categoryName,
  onRegenerate,
  isRegenerating,
}: PreviewSectionProps) {
  const { token } = antdTheme.useToken();
  const { summary, days } = preview;

  return (
    <div>
      {/* Stats banner */}
      <StatsBanner
        summary={summary}
        targetPerDay={preview.target_min_per_day}
        weekLabel={formatWeekLabel(dayjs(preview.week_start))}
        categoryName={categoryName}
      />

      {/* Collision banner */}
      {summary.collision_detected && (
        <CollisionBanner
          existingCount={summary.existing_slots_in_week}
          collisionStrategy={collisionStrategy}
          setCollisionStrategy={setCollisionStrategy}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Empty state */}
      {summary.pool_size === 0 ? (
        <div
          style={{
            border: `1px dashed ${token.colorBorderSecondary}`,
            borderRadius: 12,
            padding: '32px 16px',
            background: token.colorBgLayout,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                Nessun articolo <strong>approvato</strong> trovato per la categoria selezionata.
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${cellMinWidth}px, 1fr))`,
            gap: 12,
            marginTop: 16,
          }}
        >
          {days.map((dp) => (
            <DayCard
              key={dp.date}
              dateIso={dp.date}
              articles={dp.articles}
              totalReadingMin={dp.total_reading_min}
              targetPerDay={preview.target_min_per_day}
              existingCount={dp.existing_slots.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatsBanner
// ---------------------------------------------------------------------------

interface StatsBannerProps {
  summary: AutoPlanResponse['summary'];
  targetPerDay: number;
  weekLabel: string;
  categoryName: string;
}

function StatsBanner({ summary, targetPerDay, weekLabel, categoryName }: StatsBannerProps) {
  const { token } = antdTheme.useToken();
  const targetTotal = targetPerDay * 7;
  const targetReachedPct =
    targetTotal > 0
      ? Math.min(100, Math.round((summary.total_reading_min / targetTotal) * 100))
      : 0;

  const stat = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div style={{ flex: 1, minWidth: 110 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: token.colorTextSecondary,
          fontSize: 11,
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: 0.4,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: token.colorText, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 16 }}>{categoryIcon(categoryName)}</span>
        <Text strong style={{ color: categoryColor(categoryName), fontSize: 14 }}>
          {categoryName}
        </Text>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: token.colorTextTertiary,
          }}
        />
        <Text type="secondary" style={{ fontSize: 13 }}>
          {weekLabel}
        </Text>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {stat(
          <CalendarIcon size={12} />,
          'Articoli pianificati',
          <>
            {summary.articles_planned}
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              / {summary.pool_size} pool
            </Text>
          </>,
        )}
        {stat(
          <BookOpen size={12} />,
          'Lettura totale',
          <>
            {summary.total_reading_min}
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              min · {summary.avg_reading_min_per_day} min/g
            </Text>
          </>,
        )}
        {stat(
          <Sparkles size={12} />,
          'Target raggiunto',
          <>
            {targetReachedPct}%
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              di {targetTotal} min
            </Text>
          </>,
        )}
        {stat(
          <Layers size={12} />,
          'Giorni coperti',
          <>
            {summary.days_filled}
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
              / 7
            </Text>
          </>,
        )}
      </div>

      {summary.articles_unscheduled > 0 && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10 }}>
          {summary.articles_unscheduled} articol{summary.articles_unscheduled === 1 ? 'o' : 'i'} dal
          pool non pianificat{summary.articles_unscheduled === 1 ? 'o' : 'i'} (limite max
          giornaliero o target raggiunto).
        </Text>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollisionBanner
// ---------------------------------------------------------------------------

interface CollisionBannerProps {
  existingCount: number;
  collisionStrategy: AutoPlanCollisionStrategy;
  setCollisionStrategy: (s: AutoPlanCollisionStrategy) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function CollisionBanner({
  existingCount,
  collisionStrategy,
  setCollisionStrategy,
  onRegenerate,
  isRegenerating,
}: CollisionBannerProps) {
  return (
    <Alert
      style={{ marginTop: 14, borderRadius: 12 }}
      type="warning"
      showIcon
      icon={<AlertTriangle size={16} />}
      message={
        <span>
          La settimana contiene già <strong>{existingCount}</strong> slot pianificat
          {existingCount === 1 ? 'o' : 'i'}.
        </span>
      }
      description={
        <div style={{ marginTop: 8 }}>
          <Segmented
            options={[
              {
                label: 'Integra negli spazi liberi',
                value: 'integrate',
              },
              {
                label: 'Sostituisci tutto',
                value: 'replace',
              },
            ]}
            value={collisionStrategy}
            onChange={(v) => setCollisionStrategy(v as AutoPlanCollisionStrategy)}
            size="small"
          />
          <Button
            type="link"
            size="small"
            onClick={onRegenerate}
            loading={isRegenerating}
            style={{ marginLeft: 8 }}
          >
            Aggiorna anteprima
          </Button>
        </div>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// DayCard
// ---------------------------------------------------------------------------

interface DayCardProps {
  dateIso: string;
  articles: AutoPlanResponse['days'][number]['articles'];
  totalReadingMin: number;
  targetPerDay: number;
  existingCount: number;
}

function DayCard({
  dateIso,
  articles,
  totalReadingMin,
  targetPerDay,
  existingCount,
}: DayCardProps) {
  const { token } = antdTheme.useToken();
  const fillPct = Math.min(100, Math.round((totalReadingMin / Math.max(1, targetPerDay)) * 100));
  const isOverTarget = totalReadingMin > targetPerDay;

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
        background: token.colorBgContainer,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Day header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ fontSize: 13, color: token.colorText }}>
            {dayLabel(dateIso)}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {articles.length} articol{articles.length === 1 ? 'o' : 'i'}
            {existingCount > 0 ? ` · ${existingCount} già presenti` : ''}
          </Text>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            color: isOverTarget ? token.colorWarning : token.colorPrimary,
            background: isOverTarget ? `${token.colorWarning}1a` : `${token.colorPrimary}1a`,
          }}
        >
          <BookOpen size={11} strokeWidth={2.4} />
          {totalReadingMin} min
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: token.colorBorderSecondary }}>
        <div
          style={{
            width: `${fillPct}%`,
            height: '100%',
            background: isOverTarget
              ? `linear-gradient(90deg, ${token.colorPrimary} 0%, ${token.colorWarning} 100%)`
              : 'linear-gradient(90deg, #1677ff 0%, #722ed1 100%)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Articles list */}
      <div style={{ padding: 10, flex: 1 }}>
        {articles.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
            Nessun articolo
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {articles.map((a) => (
              <div
                key={a.article_id}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: token.colorBgLayout,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Text
                  ellipsis={{ tooltip: a.title }}
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: token.colorText,
                    lineHeight: 1.4,
                  }}
                >
                  {a.title}
                </Text>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    gap: 6,
                  }}
                >
                  {a.ai_score != null && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: aiScoreBg(a.ai_score),
                        color: aiScoreColor(a.ai_score),
                      }}
                    >
                      AI {a.ai_score}
                    </span>
                  )}
                  <Text type="secondary" style={{ fontSize: 10.5 }}>
                    {a.reading_time_min} min
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function aiScoreColor(score: number): string {
  if (score >= 75) return '#389e0d';
  if (score >= 50) return '#0958d9';
  if (score >= 25) return '#ad6800';
  return '#a8071a';
}

function aiScoreBg(score: number): string {
  if (score >= 75) return '#f6ffed';
  if (score >= 50) return '#e6f4ff';
  if (score >= 25) return '#fff7e6';
  return '#fff1f0';
}
