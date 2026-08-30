import { useQuery } from '@tanstack/react-query';

import { fetchCurrentUser } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import { mapAuthUserToViewModel } from '../mappers/display';
import { isGraphqlConfigured } from '@/lib/graphql-client';

const ME_STALE_TIME_MS = 5 * 60 * 1000;

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchCurrentUser,
    enabled: isGraphqlConfigured(),
    select: mapAuthUserToViewModel,
    staleTime: ME_STALE_TIME_MS,
  });
}
