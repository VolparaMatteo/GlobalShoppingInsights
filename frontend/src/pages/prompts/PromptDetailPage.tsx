// ---------------------------------------------------------------------------
// PromptDetailPage.tsx — Sprint 7 polish b8 (premium, Lucide, dark-mode aware)
// ---------------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { App, Button, Card, Space, Tabs, Tooltip, Typography, theme as antdTheme } from 'antd';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  Folder,
  History,
  Pause,
  Pencil,
  Play,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import PromptForm from '@/pages/prompts/components/PromptForm';
import PromptSearchHistory from '@/pages/prompts/components/PromptSearchHistory';
import RunSearchButton from '@/pages/prompts/components/RunSearchButton';
import { createPrompt, deletePrompt, getPrompt, updatePrompt } from '@/services/api/prompts.api';
import { getSearchRuns } from '@/services/api/search.api';
import type { PromptCreate, PromptUpdate } from '@/types';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function usePrompt(id: number) {
  return useQuery({
    queryKey: ['prompt', id],
    queryFn: () => getPrompt(id),
    enabled: id > 0,
  });
}

function useSearchRuns(promptId: number) {
  return useQuery({
    queryKey: ['searchRuns', promptId],
    queryFn: () => getSearchRuns({ prompt_id: promptId }),
    enabled: promptId > 0,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = antdTheme.useToken();
  const toast = useToast();
  const { modal } = App.useApp();

  const isNew = id === 'new';
  const promptId = isNew ? 0 : Number(id);
  const { data: prompt, isLoading: promptLoading } = usePrompt(promptId);
  const { data: searchRunsData, isLoading: runsLoading } = useSearchRuns(promptId);

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isNew ? 'create' : 'view');

  // ---- Mutations ----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (payload: PromptCreate) => createPrompt(payload),
    onSuccess: (created) => {
      toast.success('Prompt creato');
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      navigate(`/prompts/${created.id}`);
    },
    onError: (err) => toast.error(err),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PromptUpdate) => updatePrompt(promptId, payload),
    onSuccess: () => {
      toast.success('Prompt aggiornato');
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setMode('view');
    },
    onError: (err) => toast.error(err),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePrompt(promptId),
    onSuccess: () => {
      toast.success('Prompt eliminato');
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      navigate('/prompts');
    },
    onError: (err) => toast.error(err),
  });

  // ---- Handlers -----------------------------------------------------------

  const handleEdit = useCallback(() => setMode('edit'), []);
  const handleCancelEdit = useCallback(() => setMode('view'), []);

  const handleSubmit = useCallback(
    (values: PromptCreate | PromptUpdate) => {
      if (isNew) createMutation.mutate(values as PromptCreate);
      else updateMutation.mutate(values as PromptUpdate);
    },
    [isNew, createMutation, updateMutation],
  );

  const handleDelete = useCallback(() => {
    modal.confirm({
      title: 'Elimina prompt',
      content: `Sei sicuro di voler eliminare "${prompt?.title}"? Le esecuzioni e gli articoli scoperti non verranno cancellati, ma il prompt non sarà più pianificabile.`,
      okText: 'Elimina',
      okType: 'danger',
      cancelText: 'Annulla',
      centered: true,
      onOk: () => deleteMutation.mutateAsync(),
    });
  }, [prompt?.title, deleteMutation, modal]);

  // ---- Loading state ------------------------------------------------------

  if (!isNew && promptLoading) return <LoadingSpinner />;

  if (!isNew && !prompt) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '80px auto',
          textAlign: 'center',
          padding: 32,
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Title level={4} style={{ marginBottom: 8 }}>
          Prompt non trovato
        </Title>
        <Text type="secondary">
          Potrebbe essere stato eliminato o non hai i permessi per visualizzarlo.
        </Text>
        <div style={{ marginTop: 20 }}>
          <Button
            type="primary"
            icon={<ArrowLeft size={15} />}
            onClick={() => navigate('/prompts')}
          >
            Torna alla lista prompt
          </Button>
        </div>
      </div>
    );
  }

  // ---- Tab items ----------------------------------------------------------

  const tabItems = [
    {
      key: 'details',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Settings2 size={14} />
          Dettagli
        </span>
      ),
      children: (
        <PromptForm
          initialValues={isNew ? undefined : prompt}
          onSubmit={handleSubmit}
          onCancel={isNew ? () => navigate('/prompts') : handleCancelEdit}
          loading={isNew ? createMutation.isPending : updateMutation.isPending}
          mode={mode}
        />
      ),
    },
    ...(!isNew
      ? [
          {
            key: 'history',
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <History size={14} />
                Cronologia ricerche
              </span>
            ),
            children: (
              <PromptSearchHistory
                promptId={promptId}
                searchRuns={searchRunsData?.items ?? []}
                loading={runsLoading}
              />
            ),
          },
        ]
      : []),
  ];

  const scheduleEnabled = prompt?.schedule_enabled ?? false;
  const scheduleHours = prompt?.schedule_frequency_hours ?? null;
  const lastRun = prompt?.last_run_at ?? null;

  // ---- Render -------------------------------------------------------------

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ---- Back link ---- */}
      <button
        type="button"
        onClick={() => navigate('/prompts')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          color: token.colorTextSecondary,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          padding: '4px 8px',
          marginLeft: -8,
          marginBottom: 12,
          borderRadius: 6,
          transition: 'color 150ms, background 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = token.colorText;
          e.currentTarget.style.background = token.colorBgLayout;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = token.colorTextSecondary;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Torna ai prompt
      </button>

      {/* ---- Hero card (solo non-new) ---- */}
      {!isNew && prompt && (
        <div
          style={{
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: '22px 24px',
            marginBottom: 20,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: title + meta */}
          <div style={{ minWidth: 0, flex: '1 1 360px' }}>
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: token.colorText,
                lineHeight: 1.2,
              }}
            >
              {prompt.title}
            </Title>

            <Space size={8} wrap style={{ marginTop: 10 }}>
              {prompt.folder_name && (
                <Pill
                  icon={<Folder size={12} strokeWidth={2.2} />}
                  tone="accent"
                  label={prompt.folder_name}
                />
              )}
              <Pill
                icon={
                  scheduleEnabled ? (
                    <Play size={12} strokeWidth={2.4} />
                  ) : (
                    <Pause size={12} strokeWidth={2.4} />
                  )
                }
                tone={scheduleEnabled ? 'success' : 'neutral'}
                label={
                  scheduleEnabled
                    ? scheduleHours
                      ? `Ogni ${scheduleHours} ore`
                      : 'Pianificazione attiva'
                    : 'Pianificazione disattivata'
                }
              />
              {lastRun && (
                <Tooltip title={dayjs(lastRun).format('DD/MM/YYYY HH:mm:ss')}>
                  <Pill
                    icon={<CalendarClock size={12} strokeWidth={2.2} />}
                    tone="neutral"
                    label={`Ultima: ${dayjs(lastRun).format('DD/MM/YY HH:mm')}`}
                  />
                </Tooltip>
              )}
            </Space>
          </div>

          {/* Right: actions */}
          <Space wrap>
            {mode === 'view' && (
              <Button
                icon={<Pencil size={14} />}
                onClick={handleEdit}
                style={{ height: 36, borderRadius: 8, fontWeight: 500 }}
              >
                Modifica
              </Button>
            )}
            <RunSearchButton promptId={promptId} />
            <Button
              danger
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              style={{ height: 36, borderRadius: 8, fontWeight: 500 }}
            >
              Elimina
            </Button>
          </Space>
        </div>
      )}

      {/* ---- Create mode title ---- */}
      {isNew && (
        <div style={{ marginBottom: 20 }}>
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: -0.3,
              color: token.colorText,
              lineHeight: 1.2,
            }}
          >
            Nuovo prompt di ricerca
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Definisci cosa cercare, dove cercare e con quale frequenza.
          </Text>
        </div>
      )}

      {/* ---- Tabs card ---- */}
      <Card
        style={{
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: 'var(--shadow-sm)',
        }}
        styles={{ body: { padding: '4px 20px 20px' } }}
      >
        <Tabs defaultActiveKey="details" items={tabItems} destroyInactiveTabPane={false} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pill component (locale)
// ---------------------------------------------------------------------------

type PillTone = 'accent' | 'success' | 'neutral';

interface PillProps {
  icon: React.ReactNode;
  label: string;
  tone: PillTone;
}

function Pill({ icon, label, tone }: PillProps) {
  const toneStyle: Record<PillTone, { color: string; bg: string }> = {
    accent: { color: 'var(--color-accent)', bg: 'var(--color-primary-bg)' },
    success: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    neutral: {
      color: 'var(--color-text-tertiary)',
      bg: 'var(--color-bg-layout)',
    },
  };
  const style = toneStyle[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        fontSize: 11.5,
        fontWeight: 500,
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.color}33`,
        borderRadius: 'var(--border-radius-md)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </span>
  );
}
