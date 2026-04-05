import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, message, Tag as AntTag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getTags, createTag, updateTag, deleteTag } from '@/services/api/taxonomy.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateTime } from '@/utils/date';
import type { Tag, TagCreate, TagUpdate } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

function extractErrorDetail(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.detail) {
    return err.response.data.detail;
  }
  return 'Errore sconosciuto';
}

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
      message.success('Tag creato e sincronizzato con WordPress');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
      closeModal();
    },
    onError: (err) => {
      message.error(`Errore nella creazione del tag: ${extractErrorDetail(err)}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TagUpdate }) =>
      updateTag(id, payload),
    onSuccess: () => {
      message.success('Tag aggiornato e sincronizzato con WordPress');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
      closeModal();
    },
    onError: (err) => {
      message.error(`Errore nell'aggiornamento del tag: ${extractErrorDetail(err)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      message.success('Tag eliminato da WordPress e dal pannello');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.tags() });
    },
    onError: (err) => {
      message.error(`Errore nell'eliminazione del tag: ${extractErrorDetail(err)}`);
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
    const wpNote = tag.wp_id
      ? ' Verrà eliminato anche da WordPress.'
      : '';
    showConfirmModal({
      title: 'Elimina Tag',
      content: `Sei sicuro di voler eliminare il tag "${tag.name}"?${wpNote} Questa azione non può essere annullata.`,
      okText: 'Elimina',
      danger: true,
      onOk: () => deleteMutation.mutateAsync(tag.id),
    });
  }

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<Tag> = [
    {
      title: 'Nome',
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
      title: 'WordPress',
      dataIndex: 'wp_id',
      key: 'wp_id',
      width: 130,
      render: (val: number | null) =>
        val ? (
          <AntTag icon={<CheckCircleOutlined />} color="success">
            ID {val}
          </AntTag>
        ) : (
          <AntTag icon={<MinusCircleOutlined />} color="default">
            Non sincr.
          </AntTag>
        ),
    },
    {
      title: 'Creato il',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string | null) => formatDateTime(val),
    },
    {
      title: 'Azioni',
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
          Aggiungi Tag
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
        title={editingTag ? 'Modifica Tag' : 'Nuovo Tag'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        okText={editingTag ? 'Salva' : 'Crea'}
        cancelText="Annulla"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Inserisci il nome del tag' }]}
          >
            <Input placeholder="Nome del tag" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="tag-slug (generato automaticamente se vuoto)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
