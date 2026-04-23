import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space } from 'antd';
import { Ban, Pencil, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getUsers, createUser, updateUser } from '@/services/api/users.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateTime } from '@/utils/date';
import { ROLES, ROLE_LABELS } from '@/config/constants';
import { useToast } from '@/hooks/useToast';
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
  const toast = useToast();
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
      toast.success('Utente creato');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      closeModal();
    },
    // toast.error mappa AxiosError via describeError (IT, include 422 detail).
    onError: (err) => toast.error(err),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdate }) => updateUser(id, payload),
    onSuccess: () => {
      toast.success('Utente aggiornato');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      closeModal();
    },
    onError: (err) => toast.error(err),
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
      title: 'Disattiva utente',
      content: `Confermi la disattivazione di "${user.name}"? Non potrà più accedere finché non lo riattivi.`,
      okText: 'Disattiva',
      danger: true,
      onOk: async () => {
        await updateMutation.mutateAsync({
          id: user.id,
          payload: { is_active: false },
        });
      },
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
      title: 'Nome',
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
      title: 'Ruolo',
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
      title: 'Stato',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'}>{val ? 'Attivo' : 'Disattivato'}</Tag>
      ),
      filters: [
        { text: 'Attivo', value: true },
        { text: 'Disattivato', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Ultimo login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (val: string | null) => formatDateTime(val),
    },
    {
      title: 'Azioni',
      key: 'actions',
      width: 110,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Pencil size={14} />}
            onClick={() => openEditModal(record)}
            aria-label={`Modifica ${record.name}`}
          />
          {record.is_active && (
            <Button
              type="text"
              size="small"
              danger
              icon={<Ban size={14} />}
              onClick={() => handleDeactivate(record)}
              aria-label={`Disattiva ${record.name}`}
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
        <Button type="primary" icon={<UserPlus size={14} />} onClick={openCreateModal}>
          Nuovo utente
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
          showTotal: (total, range) => `${range[0]}-${range[1]} di ${total}`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      {/* ---- Create / Edit Modal ---- */}
      <Modal
        title={editingUser ? 'Modifica utente' : 'Nuovo utente'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        okText={editingUser ? 'Salva' : 'Crea'}
        cancelText="Annulla"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        centered
      >
        {editingUser ? (
          <Form form={editForm} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="Nome"
              rules={[{ required: true, message: 'Inserisci il nome' }]}
            >
              <Input placeholder="Nome e cognome" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Inserisci un'email" },
                { type: 'email', message: 'Email non valida' },
              ]}
            >
              <Input placeholder="utente@esempio.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              extra="Lascia vuoto per non modificare la password attuale. Minimo 12 caratteri."
              rules={[{ min: 12, message: 'Almeno 12 caratteri' }]}
            >
              <Input.Password placeholder="Nuova password (opzionale)" autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="role" label="Ruolo">
              <Select options={roleOptions} placeholder="Seleziona un ruolo" />
            </Form.Item>
          </Form>
        ) : (
          <Form form={createForm} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="Nome"
              rules={[{ required: true, message: 'Inserisci il nome' }]}
            >
              <Input placeholder="Nome e cognome" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Inserisci un'email" },
                { type: 'email', message: 'Email non valida' },
              ]}
            >
              <Input placeholder="utente@esempio.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              extra="Minimo 12 caratteri. Niente spazi iniziali/finali, niente password comuni."
              rules={[
                { required: true, message: 'Inserisci una password' },
                { min: 12, message: 'Almeno 12 caratteri' },
              ]}
            >
              <Input.Password placeholder="Password iniziale" autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="role" label="Ruolo" initialValue="contributor">
              <Select options={roleOptions} placeholder="Seleziona un ruolo" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
