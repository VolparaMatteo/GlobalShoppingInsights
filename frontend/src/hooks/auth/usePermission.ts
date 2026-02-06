import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { Permission } from '@/config/permissions';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/config/permissions';
import type { Role } from '@/config/constants';

/**
 * Checks whether the current user has the specified permission(s).
 *
 * @example
 *   const { can } = usePermission();
 *   if (can('article:edit')) { ... }
 *
 * @example
 *   const { canAll, canAny } = usePermission();
 *   canAll(['article:edit', 'article:delete']);
 *   canAny(['article:approve', 'article:reject']);
 */
export function usePermission() {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;

  const can = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    };
  }, [role]);

  const canAll = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAllPermissions(role, permissions);
    };
  }, [role]);

  const canAny = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAnyPermission(role, permissions);
    };
  }, [role]);

  return { can, canAll, canAny, role };
}
