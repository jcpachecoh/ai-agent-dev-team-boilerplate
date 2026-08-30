import { useQuery } from '@tanstack/react-query';

import {
  fetchLaborLegalParameterHistoryGql,
  fetchLaborLegalParametersGql,
} from '../api/labor-legal-parameters.graphql';
import { laborLegalParametersKeys } from '../api/labor-legal-parameters.keys';

export function useLaborLegalParameters() {
  return useQuery({
    queryKey: laborLegalParametersKeys.list(),
    queryFn: fetchLaborLegalParametersGql,
  });
}

export function useLaborLegalParameterHistory(key: string | undefined) {
  return useQuery({
    queryKey: laborLegalParametersKeys.history(key ?? ''),
    queryFn: () => fetchLaborLegalParameterHistoryGql(key as string),
    enabled: Boolean(key),
  });
}
