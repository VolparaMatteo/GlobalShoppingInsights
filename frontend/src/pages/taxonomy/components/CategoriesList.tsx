import React, { useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tree, Tag as AntTag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/api/taxonomy.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateTime } from '@/utils/date';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import axios from 'axios';

type ViewMode = 'table' | 'tree';

function extractErrorDetail(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.detail) {
    return err.response.data.detail;
  }
  return 'Errore sconosciuto';
}

export default function CategoriesList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm<CategoryCreate>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxonomy.categories(),
    queryFn: () => getCategories({ page: 1, page_size: 500 }),
  });

  const categories = data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreate) => createCategory(payload),
    onSuccess: () => {
      message.success('Categoria creata e sincronizzata con WordPress');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
      closeModal();
    },
    onError: (err) => {
      message.error(`Errore nella creazione della categoria: ${extractErrorDetail(err)}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryUpdate }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      message.success('Categoria aggiornata e sincronizzata con WordPress');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
      closeModal();
    },
    onError: (err) => {
      message.error(`Errore nell'aggiornamento della categoria: ${extractErrorDetail(err)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      message.success('Categoria eliminata da WordPress e dal pannello');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
    },
    onError: (err) => {
      message.error(`Errore nell'eliminazione della categoria: ${extractErrorDetail(err)}`);
    },
  });

  // ---- Lookup helpers -----------------------------------------------------

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  function getParentName(parentId: number | null): string {
    if (parentId === null) return '-';
    return categoryMap.get(parentId)?.name ?? `#${parentId}`;
  }

  // ---- Tree data ----------------------------------------------------------

  const treeData = useMemo<DataNode[]>(() => {
    const childrenMap = new Map<number | null, Category[]>();
    categories.forEach((cat) => {
      const key = cat.parent_id;
      const list = childrenMap.get(key) ?? [];
      list.push(cat);
      childrenMap.set(key, list);
    });

    function buildNodes(parentId: number | null): DataNode[] {
      const children = childrenMap.get(parentId) ?? [];
      return children.map((cat) => ({
        key: cat.id,
        title: `${cat.name} (${cat.slug})`,
        children: buildNodes(cat.id),
      }));
    }

    return buildNodes(null);
  }, [categories]);

  // ---- Modal helpers ------------------------------------------------------

  function openCreateModal() {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, payload: values });
      } else {
        createMutation.mutate(values);
      }
    });
  }

  function handleDelete(category: Category) {
    const wpNote = category.wp_id
      ? ' Verrà eliminata anche da WordPress.'
      : '';
    showConfirmModal({
      title: 'Elimina Categoria',
      content: `Sei sicuro di voler eliminare la categoria "${category.name}"?${wpNote} Le sottocategorie potrebbero restare orfane.`,
      okText: 'Elimina',
      danger: true,
      onOk: () => deleteMutation.mutateAsync(category.id),
    });
  }

  // ---- Parent select options (exclude self when editing) ------------------

  const parentOptions = useMemo(() => {
    return categories
      .filter((c) => !editingCategory || c.id !== editingCategory.id)
      .map((c) => ({ label: c.name, value: c.id }));
  }, [categories, editingCategory]);

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<Category> = [
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
      title: 'Genitore',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (val: number | null) => getParentName(val),
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
      title: 'Azioni',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Category) => (
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button
            icon={<UnorderedListOutlined />}
            type={viewMode === 'table' ? 'primary' : 'default'}
            onClick={() => setViewMode('table')}
          >
            Tabella
          </Button>
          <Button
            icon={<ApartmentOutlined />}
            type={viewMode === 'tree' ? 'primary' : 'default'}
            onClick={() => setViewMode('tree')}
          >
            Albero
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Aggiungi Categoria
        </Button>
      </div>

      {viewMode === 'table' ? (
        <Table<Category>
          rowKey="id"
          columns={columns}
          dataSource={categories}
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
      ) : (
        <Tree
          treeData={treeData}
          defaultExpandAll
          showLine
          style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}
        />
      )}

      <Modal
        title={editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        okText={editingCategory ? 'Salva' : 'Crea'}
        cancelText="Annulla"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Inserisci il nome della categoria' }]}
          >
            <Input placeholder="Nome della categoria" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="category-slug (generato automaticamente se vuoto)" />
          </Form.Item>
          <Form.Item name="parent_id" label="Categoria Genitore">
            <Select
              placeholder="Seleziona categoria genitore (opzionale)"
              allowClear
              options={parentOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
