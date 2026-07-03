import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchMyTenant } from '../api/empresa.queries';
import { empresaKeys } from '../api/empresa.keys';

export function useTenant() {
  return useQuery({
    queryKey: empresaKeys.tenant('me'),
    queryFn: fetchMyTenant,
    enabled: isGraphqlConfigured(),
  });
}
