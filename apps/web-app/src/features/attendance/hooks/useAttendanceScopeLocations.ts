import { useMemo } from 'react';

import { SYSTEM_ADMIN_ROLES } from '@/config/rbac.config';
import { useLocationSession } from '@/features/auth/context/LocationSessionContext';
import { useMe } from '@/features/auth/hooks/useMe';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { getRoleCodeFromToken } from '@/lib/auth-token';

export function useAttendanceScopeLocations() {
  const locationsQuery = useLocations();
  const { assignedLocations, isGeneralScope, locationId } = useLocationSession();
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const isSystemAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(roleCode ?? '');

  const locations = useMemo(() => {
    const active = (locationsQuery.data ?? []).filter((location) => location.isActive);

    if (isSystemAdmin || isGeneralScope) {
      return active;
    }

    if (locationId) {
      return active.filter((location) => location.id === locationId);
    }

    const assignedIds = new Set(assignedLocations.map((location) => location.id));
    return active.filter((location) => assignedIds.has(location.id));
  }, [assignedLocations, isGeneralScope, isSystemAdmin, locationId, locationsQuery.data]);

  return {
    locations,
    isLoading: locationsQuery.isPending,
    error: locationsQuery.error,
    isSystemAdmin,
    isGeneralScope,
  };
}
