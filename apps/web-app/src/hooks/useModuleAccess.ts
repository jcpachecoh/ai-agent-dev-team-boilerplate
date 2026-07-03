import { useMemo } from 'react';

import { AppModule, canAccessModule } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';

export function useModuleAccess(module: AppModule): boolean {
  const { data: me } = useMe();

  return useMemo(() => canAccessModule(me?.roleCode, module), [me?.roleCode, module]);
}
