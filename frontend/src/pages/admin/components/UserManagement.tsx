import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getUsers, createUser, updateUser } from '@/services/api/users.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateTime } from '@/utils/date';
import { ROLES, ROLE_LABELS } from '@/config/constants';
import type { User, UserCreate, UserUpdate } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import type { Role } from '@/config/constants';

/** Color map for role tags. */
const ROLE_COLORS: Record<Role, string> = {
  admin: 'red',
  editor: 'blue',
  reviewer: 'orange',
  contributor: 'green',
  read_only: 'default',
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm] = Form.useForm<UserCreate>();
  const [editForm] = Form.useForm<UserUpdate>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ---- Queries & Mutations ------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list({ page, page_size: pageSize }),
    queryFn: () => getUsers({ page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserCreate) => createUser(payload),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      closeModal();
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdate }) =>
      updateUser(id, payload),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      closeModal();
    },
    onError: () => {
      message.error('Failed to update user');
    },
  });

  // ---- Modal helpers ------------------------------------------------------

  function openCreateModal() {
    setEditingUser(null);
    createForm.resetFields();
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    createForm.resetFields();
    editForm.resetFields();
  }

  function handleSubmit() {
    if (editingUser) {
      editForm.validateFields().then((values) => {
        updateMutation.mutate({ id: editingUser.id, payload: values });
      });
    } else {
      createForm.validateFields().then((values) => {
        createMutation.mutate(values);
      });
    }
  }

  function handleDeactivate(user: User) {
    showConfirmModal({
      title: 'Deactivate User',
      content: `Are you sure you want to deactivate "${user.name}"? They will no longer be able to log in.`,
      okText: 'Deactivate',
      danger: true,
      onOk: () =>
        updateMutation.mutateAsync({
          id: user.id,
          payload: { is_active: false },
        }),
    });
  }

  // ---- Role select options ------------------------------------------------

  const roleOptions = ROLES.map((role) => ({
    label: ROLE_LABELS[role],
    value: role,
  }));

  // ---- Table columns ------------------------------------------------------

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role as Role] ?? 'default'}>
          {ROLE_LABELS[role as Role] ?? role}
        </Tag>
      ),
      filters: ROLES.map((r) => ({ text: ROLE_LABELS[r], value: r })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (val: string | null) => formatDateTime(val),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          {record.is_active && (
            <Button
              type="text"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  // ---- Render -------------------------------------------------------------

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add User
        </Button>
      </div>

      <Table<User>
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

      {/* ---- Create / Edit Modal ---- */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        {editingUser ? (
          <Form form={editForm} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter an email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              extra="Leave blank to keep the current password."
            >
              <Input.Password placeholder="New password (optional)" />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select options={roleOptions} placeholder="Select role" />
            </Form.Item>
          </Form>
        ) : (
          <Form form={createForm} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter an email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter a password' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
            <Form.Item name="role" label="Role" initialValue="contributor">
              <Select options={roleOptions} placeholder="Select role" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
