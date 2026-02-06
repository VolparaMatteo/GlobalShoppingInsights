import React, { useEffect } from 'react';
import { Form, Slider, Switch, Button, Spin, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getDedupSettings,
  updateDedupSettings,
} from '@/services/api/settings.api';
import type { DedupSettings as DedupSettingsType } from '@/types';

/** Query key for dedup settings (extends the settings root). */
const DEDUP_KEY = [...queryKeys.settings.all, 'dedup'] as const;

export default function DedupSettings() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<DedupSettingsType>();

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: DEDUP_KEY,
    queryFn: getDedupSettings,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<DedupSettingsType>) =>
      updateDedupSettings(payload),
    onSuccess: () => {
      message.success('Deduplication settings saved');
      queryClient.invalidateQueries({ queryKey: DEDUP_KEY });
    },
    onError: () => {
      message.error('Failed to save deduplication settings');
    },
  });

  // ---- Populate form when data loads --------------------------------------

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  // ---- Handlers -----------------------------------------------------------

  function handleSave() {
    form.validateFields().then((values) => {
      updateMutation.mutate(values);
    });
  }

  // ---- Render -------------------------------------------------------------

  if (isLoading) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="similarity_threshold"
          label="Similarity Threshold"
          extra="Articles with similarity above this threshold are considered duplicates."
        >
          <Slider
            min={0}
            max={1}
            step={0.01}
            marks={{
              0: '0',
              0.25: '0.25',
              0.5: '0.5',
              0.75: '0.75',
              1: '1',
            }}
            tooltip={{ formatter: (val) => `${val}` }}
          />
        </Form.Item>

        <Form.Item
          name="use_content_hash"
          label="Use Content Hash"
          valuePropName="checked"
          extra="Enable exact-match deduplication using content hashes."
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="use_semantic_similarity"
          label="Use Semantic Similarity"
          valuePropName="checked"
          extra="Enable AI-based semantic similarity comparison for near-duplicate detection."
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
