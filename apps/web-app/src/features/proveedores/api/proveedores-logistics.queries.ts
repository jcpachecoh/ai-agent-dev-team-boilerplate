import { graphqlRequest } from '@/lib/graphql-client';

import type { SupplierLogisticsHistoryEntry } from '../types';

export const SUPPLIER_LOGISTICS_HISTORY_QUERY = `
  query SupplierLogisticsHistory($supplierId: ID!) {
    supplierLogisticsHistory(supplierId: $supplierId) {
      id
      action
      actorEmail
      createdAt
      changes {
        field
        oldValue
        newValue
      }
    }
  }
`;

export async function fetchSupplierLogisticsHistory(
  supplierId: string,
): Promise<SupplierLogisticsHistoryEntry[]> {
  const data = await graphqlRequest<{
    supplierLogisticsHistory: SupplierLogisticsHistoryEntry[];
  }>(SUPPLIER_LOGISTICS_HISTORY_QUERY, { supplierId });
  return data.supplierLogisticsHistory;
}
