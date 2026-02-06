import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getTags, createTag, updateTag, deleteTag } from '@/services/api/taxonomy.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateTime } from '@/utils/date';
import type { Tag, TagCreate, TagUpdate } from '@/types';
import type { ColumnsType } from 'antd/es/table';

export default function TagsList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm<TagCreate>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxonomy.tags(),
    queryFn: () => getTags({ page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: TagCreate) => createTag(payload),
    onSuccess: () => {
      message.success('Tag created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
      closeModal();
    },
    onError: () => {
      message.error('Failed to create tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TagUpdate }) =>
      updateTag(id, payload),
    onSuccess: () => {
      message.success('Tag updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
      closeModal();
    },
    onError: () => {
      message.error('Failed to update tag');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      message.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
    },
    onError: () => {
      message.error('Failed to delete tag');
    },
  });

  // ---- Modal helpers ------------------------------------------------------

  function openCreateModal() {
    setEditingTag(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(tag: Tag) {
    setEditingTag(tag);
    form.setFieldsValue({ name: tag.name, slug: tag.slug });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTag(null);
    form.resetFields();
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingTag) {
        updateMutation.mutate({ id: editingTag.id, payload: values });
      } else {
        createMutation.mutate(values);
      }
    });
  }

  function handleDelete(tag: Tag) {
    showConfirmModal({
      title: 'Delete Tag',
      content: `Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`,
      okText: 'Delete',
      danger: true,
      onOk: () => deleteMutation.mutateAsync(tag.id),
    });
  }

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<Tag> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'WP ID',
      dataIndex: 'wp_id',
      key: 'wp_id',
      render: (val: number | null) => val ?? '-',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string | null) => formatDateTime(val),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Tag) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Tag
        </Button>
      </div>

      <Table<Tag>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editingTag ? 'Edit Tag' : 'Add Tag'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a tag name' }]}
          >
            <Input placeholder="Tag name" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="tag-slug (auto-generated if empty)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
