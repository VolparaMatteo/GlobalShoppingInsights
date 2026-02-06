import React, { Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { Spin } from 'antd';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/router/ProtectedRoute';
import {
  LoginPage,
  DashboardPage,
  PromptsListPage,
  PromptDetailPage,
  InboxPage,
  ArticleDetailPage,
  CalendarPage,
  TaxonomyPage,
  SettingsPage,
  NotFoundPage,
} from '@/router/LazyPages';

const suspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '20% auto' }} />}>
    <Component />
  </Suspense>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: suspense(LoginPage),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: suspense(DashboardPage),
          },
          {
            path: '/prompts',
            element: suspense(PromptsListPage),
          },
          {
            path: '/prompts/:id',
            element: suspense(PromptDetailPage),
          },
          {
            path: '/inbox',
            element: suspense(InboxPage),
          },
          {
            path: '/articles/:id',
            element: suspense(ArticleDetailPage),
          },
          {
            path: '/calendar',
            element: suspense(CalendarPage),
          },
          {
            path: '/taxonomy',
            element: suspense(TaxonomyPage),
          },
          {
            path: '/settings',
            element: suspense(SettingsPage),
          },
          {
            path: '*',
            element: suspense(NotFoundPage),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
