import React, { useEffect } from 'react';
import { Form, InputNumber, Input, Switch, Button, Spin, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getScrapingSettings, updateScrapingSettings } from '@/services/api/settings.api';
import type { ScrapingSettings as ScrapingSettingsType } from '@/types';

/** Query key for scraping settings (extends the settings root). */
const SCRAPING_KEY = [...queryKeys.settings.all, 'scraping'] as const;

export default function ScrapingSettings() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ScrapingSettingsType>();

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: SCRAPING_KEY,
    queryFn: getScrapingSettings,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ScrapingSettingsType>) => updateScrapingSettings(payload),
    onSuccess: () => {
      message.success('Scraping settings saved');
      queryClient.invalidateQueries({ queryKey: SCRAPING_KEY });
    },
    onError: () => {
      message.error('Failed to save scraping settings');
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
          name="max_concurrent_requests"
          label="Max Concurrent Requests"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} max={50} />
        </Form.Item>

        <Form.Item
          name="request_timeout_seconds"
          label="Request Timeout (seconds)"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber style={{ width: '100%' }} min={5} max={300} />
        </Form.Item>

        <Form.Item
          name="user_agent"
          label="User Agent"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="GSI-Bot/1.0" />
        </Form.Item>

        <Form.Item name="respect_robots_txt" label="Respect robots.txt" valuePropName="checked">
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
