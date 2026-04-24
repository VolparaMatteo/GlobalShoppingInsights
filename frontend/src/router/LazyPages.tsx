import { lazy } from 'react';

export const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
export const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
export const AlertsPage = lazy(() => import('@/pages/dashboard/AlertsPage'));
export const PromptsListPage = lazy(() => import('@/pages/prompts/PromptsListPage'));
export const PromptDetailPage = lazy(() => import('@/pages/prompts/PromptDetailPage'));
export const InboxPage = lazy(() => import('@/pages/inbox/InboxPage'));
export const ArticleDetailPage = lazy(() => import('@/pages/article/ArticleDetailPage'));
export const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
export const TaxonomyPage = lazy(() => import('@/pages/taxonomy/TaxonomyPage'));
export const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
export const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
export const SupportPage = lazy(() => import('@/pages/support/SupportPage'));
export const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
export const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'));
