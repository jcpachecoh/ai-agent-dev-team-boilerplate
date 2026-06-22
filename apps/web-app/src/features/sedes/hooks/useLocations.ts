import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchLocationTableRows, fetchLocation, fetchLocationUsers } from '../api/sedes.queries';
import { sedesKeys } from '../api/sedes.keys';
import { mapLocationAssignedUser } from '../mappers/api';
import { useRestaurantId } from './useRestaurantId';

export function useLocations() {
  const restaurantId = useRestaurantId();

  return useQuery({
    queryKey: sedesKeys.list(restaurantId),
    queryFn: () => fetchLocationTableRows(restaurantId),
    enabled: isGraphqlConfigured(),
  });
}

export function useLocationMetrics() {
  const query = useLocations();

  const rows = query.data ?? [];
  const metrics = {
    total: rows.length,
    activeCount: rows.filter((row) => row.isActive).length,
    inactiveCount: rows.filter((row) => !row.isActive).length,
  };

  return { ...query, metrics };
}

export function useLocation(locationId: string | undefined) {
  const restaurantId = useRestaurantId();

  return useQuery({
    queryKey: sedesKeys.detail(restaurantId, locationId ?? ''),
    queryFn: () => fetchLocation(locationId!, restaurantId),
    enabled: isGraphqlConfigured() && Boolean(locationId),
  });
}

export function useLocationUsers(locationId: string | undefined) {
  const restaurantId = useRestaurantId();

  return useQuery({
    queryKey: sedesKeys.users(restaurantId, locationId ?? ''),
    queryFn: () => fetchLocationUsers(locationId!, restaurantId),
    enabled: isGraphqlConfigured() && Boolean(locationId),
    select: (users) => users.map(mapLocationAssignedUser),
  });
}
