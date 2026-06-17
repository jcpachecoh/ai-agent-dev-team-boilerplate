import { getTenantId } from '@/lib/tenant';

import { useMe } from '@/features/auth/hooks/useMe';

/** GraphQL `restaurantId` must match the authenticated tenant. */
export function useRestaurantId(): string {
  const { data: me } = useMe();
  return me?.tenantId ?? getTenantId();
}
