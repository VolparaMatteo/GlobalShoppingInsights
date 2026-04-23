import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import itIT from 'antd/locale/it_IT';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/router';
import { themeForMode } from '@/config/theme';
import { useUiStore } from '@/stores/uiStore';
import '@/assets/styles/global.css';

// Inter font self-hosted (no CDN, GDPR-friendly)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export default function App() {
  const themeMode = useUiStore((s) => s.themeMode);

  // Sincronizza attributo data-theme su <html> per CSS dinamico.
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeForMode(themeMode)} locale={itIT}>
        <AntdApp message={{ maxCount: 3, top: 72 }} notification={{ placement: 'bottomRight' }}>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
