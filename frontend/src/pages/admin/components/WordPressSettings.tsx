import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Button, Space, Spin, Typography, message } from 'antd';
import { SaveOutlined, ApiOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getWPConfig,
  updateWPConfig,
  testWPConnection,
} from '@/services/api/settings.api';
import { formatDateTime } from '@/utils/date';
import type { WPConfigUpdate } from '@/types';

export default function WordPressSettings() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<WPConfigUpdate>();

  // ---- Queries & Mutations ------------------------------------------------

  const { data: config, isLoading } = useQuery({
    queryKey: queryKeys.settings.wordpress(),
    queryFn: getWPConfig,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: WPConfigUpdate) => updateWPConfig(payload),
    onSuccess: () => {
      message.success('WordPress configuration saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.wordpress() });
    },
    onError: () => {
      message.error('Failed to save WordPress configuration');
    },
  });

  const testMutation = useMutation({
    mutationFn: testWPConnection,
    onSuccess: (data) => {
      message.success(data.message || 'Connection successful');
    },
    onError: () => {
      message.error('Connection test failed. Please check your credentials.');
    },
  });

  // ---- Populate form when config loads ------------------------------------

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        wp_url: config.wp_url,
        wp_username: config.wp_username,
        default_author_id: config.default_author_id,
      });
    }
  }, [config, form]);

  // ---- Handlers -----------------------------------------------------------

  function handleSave() {
    form.validateFields().then((values) => {
      updateMutation.mutate(values);
    });
  }

  function handleTestConnection() {
    testMutation.mutate();
  }

  // ---- Render -------------------------------------------------------------

  if (isLoading) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="wp_url"
          label="WordPress URL"
          rules={[{ required: true, message: 'Please enter the WordPress URL' }]}
        >
          <Input placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          name="wp_username"
          label="WordPress Username"
          rules={[{ required: true, message: 'Please enter the WordPress username' }]}
        >
          <Input placeholder="admin" />
        </Form.Item>

        <Form.Item
          name="wp_app_password"
          label="Application Password"
          extra={
            config?.has_password
              ? 'A password is already configured. Leave blank to keep the current one.'
              : 'No password configured yet.'
          }
        >
          <Input.Password placeholder="Enter application password" />
        </Form.Item>

        <Form.Item name="default_author_id" label="Default Author ID">
          <InputNumber style={{ width: '100%' }} placeholder="1" min={1} />
        </Form.Item>

        {config?.last_sync_at && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Last synced: {formatDateTime(config.last_sync_at)}
          </Typography.Paragraph>
        )}

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateMutation.isPending}
            >
              Save
            </Button>
            <Button
              icon={<ApiOutlined />}
              onClick={handleTestConnection}
              loading={testMutation.isPending}
            >
              Test Connection
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
