// ---------------------------------------------------------------------------
// LoginPage.tsx — Sprint 7 polish b3
//
// Form dentro AuthLayout (split-screen). Input con icone Lucide, error alert
// motion-based, submit full-width, link dimentica password (disabled,
// visivamente chiaro).
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Space, Typography } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { describeError } from '@/utils/errorToast';

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (err: unknown) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            key="login-error"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Form<LoginFormValues>
        name="login"
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
        initialValues={{ remember: true }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Inserisci la tua email' },
            { type: 'email', message: 'Formato email non valido' },
          ]}
        >
          <Input
            prefix={<Mail size={16} strokeWidth={2} />}
            placeholder="nome@cliente.tld"
            autoComplete="email"
            aria-label="Email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Inserisci la password' }]}
        >
          <Input.Password
            prefix={<Lock size={16} strokeWidth={2} />}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-label="Password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 20 }}>
          <Space
            style={{
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ricordami</Checkbox>
            </Form.Item>
            <Typography.Link
              disabled
              style={{ fontSize: 13 }}
              title="Contatta l'amministratore per reimpostare la password"
            >
              Password dimenticata?
            </Typography.Link>
          </Space>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 44, fontWeight: 600, fontSize: 15 }}
          >
            Accedi
          </Button>
        </Form.Item>

        <Typography.Paragraph
          type="secondary"
          style={{
            fontSize: 12,
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          Problemi con l'accesso? Scrivi al tuo amministratore GSI o consulta il{' '}
          <code style={{ fontSize: 12 }}>USER_GUIDE.md</code> fornito al team.
        </Typography.Paragraph>
      </Form>
    </>
  );
}
