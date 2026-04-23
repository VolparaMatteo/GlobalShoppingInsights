// ---------------------------------------------------------------------------
// LoginPage.tsx — Sprint 7 polish b4 (premium)
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';

import { useAuth } from '@/hooks/auth/useAuth';
import { describeError } from '@/utils/errorToast';

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const inputStyle = {
  height: 48,
  borderRadius: 10,
  fontSize: 15,
  borderColor: '#e5e7eb',
} as const;

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
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ borderRadius: 10 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Form<LoginFormValues>
        name="login"
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{ remember: true }}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={<span style={labelStyle}>Email</span>}
          rules={[
            { required: true, message: 'Inserisci la tua email' },
            { type: 'email', message: 'Formato email non valido' },
          ]}
        >
          <Input
            prefix={<Mail size={16} strokeWidth={2} style={{ color: '#9ca3af' }} />}
            placeholder="nome@azienda.tld"
            autoComplete="email"
            aria-label="Email"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={labelStyle}>Password</span>}
          rules={[{ required: true, message: 'Inserisci la password' }]}
        >
          <Input.Password
            prefix={<Lock size={16} strokeWidth={2} style={{ color: '#9ca3af' }} />}
            placeholder="Almeno 12 caratteri"
            autoComplete="current-password"
            aria-label="Password"
            style={inputStyle}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>
                <span style={{ fontSize: 14, color: '#4b5563' }}>Ricordami</span>
              </Checkbox>
            </Form.Item>
            <Typography.Link
              disabled
              style={{ fontSize: 13, color: '#9ca3af' }}
              title="Contatta l'amministratore per reimpostare la password"
            >
              Password dimenticata?
            </Typography.Link>
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 48,
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 10,
              background: loading ? undefined : 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              border: 'none',
              boxShadow: loading ? undefined : '0 6px 16px -4px rgba(114, 46, 209, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            icon={!loading ? <ArrowRight size={16} strokeWidth={2.4} /> : undefined}
            iconPosition="end"
          >
            Accedi
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  letterSpacing: 0.1,
} as const;
