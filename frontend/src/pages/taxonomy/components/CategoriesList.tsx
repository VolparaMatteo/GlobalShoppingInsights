import React, { useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tree } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
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

type ViewMode = 'table' | 'tree';

export default function CategoriesList() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm<CategoryCreate>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxonomy.categories(),
    queryFn: () => getCategories({ page: 1, page_size: 500 }),
  });

  const categories = data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreate) => createCategory(payload),
    onSuccess: () => {
      message.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
      closeModal();
    },
    onError: () => {
      message.error('Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryUpdate }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      message.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
      closeModal();
    },
    onError: () => {
      message.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      message.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.categories() });
    },
    onError: () => {
      message.error('Failed to delete category');
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
    showConfirmModal({
      title: 'Delete Category',
      content: `Are you sure you want to delete the category "${category.name}"? Child categories may become orphaned.`,
      okText: 'Delete',
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
      title: 'Parent',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (val: number | null) => getParentName(val),
    },
    {
      title: 'WP ID',
      dataIndex: 'wp_id',
      key: 'wp_id',
      render: (val: number | null) => val ?? '-',
    },
    {
      title: 'Actions',
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
            Table
          </Button>
          <Button
            icon={<ApartmentOutlined />}
            type={viewMode === 'tree' ? 'primary' : 'default'}
            onClick={() => setViewMode('tree')}
          >
            Tree
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Category
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
        title={editingCategory ? 'Edit Category' : 'Add Category'}
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
            rules={[{ required: true, message: 'Please enter a category name' }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="category-slug (auto-generated if empty)" />
          </Form.Item>
          <Form.Item name="parent_id" label="Parent Category">
            <Select
              placeholder="Select parent category (optional)"
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
