// ---------------------------------------------------------------------------
// NotFoundPage.tsx  --  404 error page
// ---------------------------------------------------------------------------
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Page Not Found. The page you are looking for does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      }
    />
  );
}
