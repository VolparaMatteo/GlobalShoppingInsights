// ---------------------------------------------------------------------------
// ForbiddenPage.tsx  --  403 error page
// ---------------------------------------------------------------------------
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Access Denied. You do not have permission to view this page."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      }
    />
  );
}
