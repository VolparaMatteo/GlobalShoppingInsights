// ---------------------------------------------------------------------------
// PromptDetailPage.tsx  --  View / edit a single prompt with search history
// ---------------------------------------------------------------------------
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  message,
  Modal,
  Space,
  Spin,
  Tabs,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';

import {
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from '@/services/api/prompts.api';
import { getSearchRuns } from '@/services/api/search.api';
import type { Prompt, PromptCreate, PromptUpdate } from '@/types';

import PromptForm from '@/pages/prompts/components/PromptForm';
import PromptSearchHistory from '@/pages/prompts/components/PromptSearchHistory';
import RunSearchButton from '@/pages/prompts/components/RunSearchButton';

const { Title } = Typography;

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

  const isNew = id === 'new';
  const promptId = isNew ? 0 : Number(id);
  const { data: prompt, isLoading: promptLoading } = usePrompt(promptId);
  const { data: searchRunsData, isLoading: runsLoading } = useSearchRuns(promptId);

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isNew ? 'create' : 'view');

  // ---- Mutations ----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (payload: PromptCreate) => createPrompt(payload),
    onSuccess: (created) => {
      message.success('Prompt created successfully');
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      navigate(`/prompts/${created.id}`);
    },
    onError: () => {
      message.error('Failed to create prompt');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PromptUpdate) => updatePrompt(promptId, payload),
    onSuccess: () => {
      message.success('Prompt updated successfully');
      queryClient.invalidateQueries({ queryKey: ['prompt', promptId] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setMode('view');
    },
    onError: () => {
      message.error('Failed to update prompt');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePrompt(promptId),
    onSuccess: () => {
      message.success('Prompt deleted');
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      navigate('/prompts');
    },
    onError: () => {
      message.error('Failed to delete prompt');
    },
  });

  // ---- Handlers -----------------------------------------------------------

  const handleEdit = useCallback(() => setMode('edit'), []);
  const handleCancelEdit = useCallback(() => setMode('view'), []);

  const handleSubmit = useCallback(
    (values: PromptCreate | PromptUpdate) => {
      if (isNew) {
        createMutation.mutate(values as PromptCreate);
      } else {
        updateMutation.mutate(values as PromptUpdate);
      }
    },
    [isNew, createMutation, updateMutation],
  );

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: 'Delete Prompt',
      content: `Are you sure you want to delete "${prompt?.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutateAsync(),
    });
  }, [prompt?.title, deleteMutation]);

  // ---- Loading state ------------------------------------------------------

  if (!isNew && promptLoading) {
    return (
      <Spin size="large" style={{ display: 'block', margin: '20% auto' }} />
    );
  }

  if (!isNew && !prompt) {
    return (
      <div style={{ textAlign: 'center', marginTop: 64 }}>
        <Title level={4}>Prompt not found</Title>
        <Button type="link" onClick={() => navigate('/prompts')}>
          Back to prompts list
        </Button>
      </div>
    );
  }

  // ---- Tab items ----------------------------------------------------------

  const tabItems = [
    {
      key: 'details',
      label: 'Details',
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
            label: 'Search History',
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

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/prompts')}
          />
          <Title level={4} style={{ margin: 0 }}>
            {isNew ? 'New Prompt' : prompt!.title}
          </Title>
        </Space>

        {!isNew && (
          <Space>
            {mode === 'view' && (
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                Edit
              </Button>
            )}
            <RunSearchButton promptId={promptId} />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Space>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="details"
        items={tabItems}
        destroyInactiveTabPane={false}
      />
    </div>
  );
}
