// ---------------------------------------------------------------------------
// ProfilePage.tsx — Sprint 7 polish b5
//
// Self-service profilo utente: foto, nome, email, cambio password.
// ---------------------------------------------------------------------------
import { useRef, useState } from 'react';

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  theme as antdTheme,
  Typography,
} from 'antd';
import { Camera, Trash2, Lock, Mail, User as UserIcon } from 'lucide-react';

import AvatarCropModal from '@/components/common/AvatarCropModal';
import PageHeader from '@/components/common/PageHeader';
import RoleChip from '@/components/common/RoleChip';
import {
  useDeleteMyAvatar,
  useUpdateMyProfile,
  useUploadMyAvatar,
} from '@/hooks/queries/useMyProfile';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

interface ProfileFormValues {
  name: string;
  email: string;
}

interface PasswordFormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

function initialsFromName(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENT = 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { token } = antdTheme.useToken();
  const toast = useToast();

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Crop modal state: quando l'utente seleziona un file, lo apriamo nel
  // cropper invece di caricarlo direttamente.
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const updateMutation = useUpdateMyProfile();
  const uploadAvatarMutation = useUploadMyAvatar();
  const deleteAvatarMutation = useDeleteMyAvatar();

  if (!user) return null;

  const initials = initialsFromName(user.name);
  const avatarUrl = user.avatar_url ?? null;

  // ---- Avatar handlers ----------------------------------------------------
  // Step 1: user seleziona file → validiamo + apriamo crop modal (non upload).
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset per poter ricaricare stesso file
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Formato non supportato. Usa JPEG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("L'immagine supera la dimensione massima di 4 MB.");
      return;
    }
    setUploadError(null);
    setCropFile(file);
    setCropOpen(true);
  };

  // Step 2: il modal ritorna un Blob quadrato — lo upiamo al backend.
  const handleCropConfirm = (blob: Blob) => {
    const fileOut = new File([blob], 'avatar.png', { type: 'image/png' });
    uploadAvatarMutation.mutate(fileOut, {
      onSuccess: () => {
        toast.success('Avatar aggiornato');
        setCropOpen(false);
        setCropFile(null);
      },
      onError: (err) => toast.error(err),
    });
  };

  const handleCropCancel = () => {
    if (uploadAvatarMutation.isPending) return;
    setCropOpen(false);
    setCropFile(null);
  };

  const handleDeleteAvatar = () => {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => toast.success('Avatar rimosso'),
      onError: (err) => toast.error(err),
    });
  };

  // ---- Profile submit -----------------------------------------------------
  const handleProfileSubmit = (values: ProfileFormValues) => {
    const payload: { name?: string; email?: string } = {};
    if (values.name !== user.name) payload.name = values.name;
    if (values.email !== user.email) payload.email = values.email;

    if (!payload.name && !payload.email) {
      toast.info('Nessuna modifica da salvare');
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => toast.success('Profilo aggiornato'),
      onError: (err) => toast.error(err),
    });
  };

  const handlePasswordSubmit = (values: PasswordFormValues) => {
    updateMutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          toast.success('Password aggiornata');
          passwordForm.resetFields();
        },
        onError: (err) => toast.error(err),
      },
    );
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <PageHeader
        title="Il mio profilo"
        subtitle="Gestisci le tue informazioni personali, l'avatar e la password."
      />

      {/* ============ AVATAR + HEADER ============ */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Cover gradient */}
        <div
          style={{
            height: 120,
            background: AVATAR_GRADIENT,
            position: 'relative',
          }}
        />

        <div style={{ padding: '0 32px 24px', position: 'relative', marginTop: -50 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
              <div
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: '50%',
                  background: token.colorBgContainer,
                  padding: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  flexShrink: 0,
                }}
              >
                {avatarUrl ? (
                  <Avatar src={avatarUrl} size={100} style={{ border: 'none' }} alt={user.name} />
                ) : (
                  <Avatar
                    size={100}
                    style={{
                      background: AVATAR_GRADIENT,
                      color: '#ffffff',
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {initials}
                  </Avatar>
                )}
              </div>

              <div style={{ paddingBottom: 12 }}>
                <Title level={3} style={{ margin: 0, color: token.colorText, lineHeight: 1.2 }}>
                  {user.name}
                </Title>
                <Space size={8} style={{ marginTop: 6 }}>
                  <RoleChip role={user.role} size="md" />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {user.email}
                  </Text>
                </Space>
              </div>
            </div>

            <Space style={{ paddingBottom: 12 }}>
              <Button
                icon={<Camera size={14} />}
                loading={uploadAvatarMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {avatarUrl ? 'Cambia avatar' : 'Carica avatar'}
              </Button>
              {avatarUrl && (
                <Button
                  icon={<Trash2 size={14} />}
                  danger
                  loading={deleteAvatarMutation.isPending}
                  onClick={handleDeleteAvatar}
                >
                  Rimuovi
                </Button>
              )}
            </Space>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {uploadError && (
            <Alert
              type="error"
              message={uploadError}
              showIcon
              closable
              onClose={() => setUploadError(null)}
              style={{ marginTop: 16 }}
            />
          )}
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
            JPEG, PNG, WebP o GIF — max 4 MB. L'avatar verrà ridimensionato automaticamente a 512px
            lato lungo e convertito in WebP per ottimizzare il caricamento.
          </Text>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* ============ DATI PERSONALI ============ */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <UserIcon size={16} />
                <span>Dati personali</span>
              </Space>
            }
            style={{ borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` }}
          >
            <Form<ProfileFormValues>
              form={profileForm}
              layout="vertical"
              initialValues={{ name: user.name, email: user.email }}
              onFinish={handleProfileSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label="Nome visualizzato"
                rules={[{ required: true, message: 'Il nome è obbligatorio' }]}
              >
                <Input prefix={<UserIcon size={14} />} placeholder="Il tuo nome" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "L'email è obbligatoria" },
                  { type: 'email', message: 'Formato email non valido' },
                ]}
              >
                <Input prefix={<Mail size={14} />} placeholder="nome@azienda.tld" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={updateMutation.isPending} block>
                  Salva modifiche
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* ============ CAMBIO PASSWORD ============ */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <Lock size={16} />
                <span>Cambia password</span>
              </Space>
            }
            style={{ borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` }}
          >
            <Form<PasswordFormValues>
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="current_password"
                label="Password corrente"
                rules={[{ required: true, message: 'Inserisci la password corrente' }]}
              >
                <Input.Password
                  prefix={<Lock size={14} />}
                  placeholder="Password attuale"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="Nuova password"
                rules={[
                  { required: true, message: 'Inserisci la nuova password' },
                  { min: 12, message: 'Minimo 12 caratteri' },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<Lock size={14} />}
                  placeholder="Almeno 12 caratteri"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Conferma nuova password"
                dependencies={['new_password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Conferma la nuova password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Le password non coincidono'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<Lock size={14} />}
                  placeholder="Ripeti la nuova password"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateMutation.isPending}
                  block
                  danger
                >
                  Aggiorna password
                </Button>
              </Form.Item>

              <Divider style={{ margin: '16px 0 8px' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Dopo aver aggiornato la password, sarai disconnesso e dovrai rifare login con le
                nuove credenziali.
              </Text>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* ============ Modal crop avatar (simil-WhatsApp) ============ */}
      <AvatarCropModal
        open={cropOpen}
        file={cropFile}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
        loading={uploadAvatarMutation.isPending}
      />
    </div>
  );
}
