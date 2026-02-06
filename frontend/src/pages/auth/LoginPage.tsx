// ---------------------------------------------------------------------------
// LoginPage.tsx  --  Authentication login form
// Renders inside AuthLayout which provides the centered card and branding.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/auth/useAuth';

interface LoginFormValues {
  email: string;
  password: string;
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
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form<LoginFormValues>
        name="login"
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Log in
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
