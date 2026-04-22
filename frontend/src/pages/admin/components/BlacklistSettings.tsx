import React, { useState } from 'react';
import { Table, Button, Input, Space, Form, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getBlacklist, addBlacklist, removeBlacklist } from '@/services/api/settings.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import type { BlacklistEntry, BlacklistCreate } from '@/types';
import type { ColumnsType } from 'antd/es/table';

/** Query key for the blacklist (extends the settings root). */
const BLACKLIST_KEY = [...queryKeys.settings.all, 'blacklist'] as const;

export default function BlacklistSettings() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<BlacklistCreate>();

  // ---- Queries & Mutations ------------------------------------------------

  const { data: entries, isLoading } = useQuery({
    queryKey: BLACKLIST_KEY,
    queryFn: getBlacklist,
  });

  const addMutation = useMutation({
    mutationFn: (payload: BlacklistCreate) => addBlacklist(payload),
    onSuccess: () => {
      message.success('Domain added to blacklist');
      queryClient.invalidateQueries({ queryKey: BLACKLIST_KEY });
      closeModal();
    },
    onError: () => {
      message.error('Failed to add domain to blacklist');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBlacklist(id),
    onSuccess: () => {
      message.success('Domain removed from blacklist');
      queryClient.invalidateQueries({ queryKey: BLACKLIST_KEY });
    },
    onError: () => {
      message.error('Failed to remove domain');
    },
  });

  // ---- Modal helpers ------------------------------------------------------

  function openModal() {
    form.resetFields();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    form.resetFields();
  }

  function handleAdd() {
    form.validateFields().then((values) => {
      addMutation.mutate(values);
    });
  }

  function handleRemove(entry: BlacklistEntry) {
    showConfirmModal({
      title: 'Remove Domain',
      content: `Remove "${entry.domain}" from the blacklist?`,
      okText: 'Remove',
      danger: true,
      onOk: () => removeMutation.mutateAsync(entry.id),
    });
  }

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<BlacklistEntry> = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      sorter: (a, b) => a.domain.localeCompare(b.domain),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (val: string | null) => val ?? '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: BlacklistEntry) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record)}
        />
      ),
    },
  ];

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Add Domain
        </Button>
      </div>

      <Table<BlacklistEntry>
        rowKey="id"
        columns={columns}
        dataSource={entries ?? []}
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title="Add Domain to Blacklist"
        open={modalOpen}
        onOk={handleAdd}
        onCancel={closeModal}
        confirmLoading={addMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="domain"
            label="Domain"
            rules={[{ required: true, message: 'Please enter a domain name' }]}
          >
            <Input placeholder="example.com" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} placeholder="Reason for blocking this domain (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
