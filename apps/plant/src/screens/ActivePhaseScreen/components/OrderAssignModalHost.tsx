import { PlantOrderAssignModal } from '@restopsiq/ui';
import { useEffect, useMemo, type JSX } from 'react';

import { useAvailableProductionOrders } from '@/hooks/useAvailableProductionOrders';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';

export interface OrderAssignModalHostProps {
  open: boolean;
  cellIndex: number | null;
  onClose: () => void;
}

export function OrderAssignModalHost({
  open,
  cellIndex,
  onClose,
}: OrderAssignModalHostProps): JSX.Element | null {
  const cells = useDashboardLayoutStore((s) => s.cells);
  const assignOrderToCell = useDashboardLayoutStore((s) => s.assignOrderToCell);
  const setAvailableOrders = useDashboardLayoutStore((s) => s.setAvailableOrders);

  const { data, isLoading, isError, refetch } = useAvailableProductionOrders(open);

  useEffect(() => {
    if (data) {
      setAvailableOrders(data);
    }
  }, [data, setAvailableOrders]);

  const orders = useMemo(() => {
    if (!data || cellIndex === null) return [];

    const assignedElsewhere = new Set(
      cells
        .filter((cell) => cell.cellIndex !== cellIndex && cell.orderId)
        .map((cell) => cell.orderId as string),
    );

    return data.filter((order) => !assignedElsewhere.has(order.orderId));
  }, [cellIndex, cells, data]);

  const showLoading = open && (isLoading || data === undefined);

  if (cellIndex === null) return null;

  return (
    <PlantOrderAssignModal
      open={open}
      cellIndex={cellIndex}
      orders={orders}
      isLoading={showLoading}
      theme="dark"
      size="xl"
      errorMessage={open && isError && !showLoading ? 'No se pudieron cargar las órdenes.' : null}
      onRetry={isError ? () => void refetch() : undefined}
      onClose={onClose}
      onSelectOrder={(orderId) => {
        const order = orders.find((item) => item.orderId === orderId);
        if (!order) return;
        assignOrderToCell(cellIndex, order);
        onClose();
      }}
    />
  );
}

export default OrderAssignModalHost;
