import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { theme } from '@/config/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}
