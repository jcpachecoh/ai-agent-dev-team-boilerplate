import { useQuery } from '@tanstack/react-query';

import { fetchSupplyItems } from '@/features/inventario/api/inventario.api';
import { inventarioKeys } from '@/features/inventario/api/inventario.keys';

export function useEditorSupplyItems(enabled = true) {
  return useQuery({
    queryKey: inventarioKeys.items({ isActive: true }),
    queryFn: () => fetchSupplyItems({ isActive: true }),
    enabled,
  });
}
