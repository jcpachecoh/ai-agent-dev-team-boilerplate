import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchInventoryAlertSummary,
  fetchInventoryAlerts,
  fetchInventoryDashboard,
  fetchInventoryReport,
  resolveInventoryAlert,
} from '@/api/inventory';

import { inventarioKeys } from '../api/inventario.keys';

export function useInventoryDashboard() {
  return useQuery({
    queryKey: inventarioKeys.dashboard(),
    queryFn: fetchInventoryDashboard,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: inventarioKeys.alerts(),
    queryFn: fetchInventoryAlerts,
  });
}

export function useInventoryAlertSummary() {
  return useQuery({
    queryKey: inventarioKeys.alertSummary(),
    queryFn: fetchInventoryAlertSummary,
  });
}

export function useResolveInventoryAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resolveInventoryAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.alerts() });
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.alertSummary() });
    },
  });
}

export function useInventoryReport(type: string, from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: inventarioKeys.report(type, from, to),
    queryFn: () => fetchInventoryReport(type, from, to),
    enabled,
  });
}
