import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ForbiddenPage } from '@/router/LazyPages';
import { Suspense } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <Suspense fallback={null}>
        <ForbiddenPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}
