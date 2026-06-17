import { PlantOrderAssignModal } from '@restopsiq/ui';
import type { JSX } from 'react';

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
  const availableOrders = useDashboardLayoutStore((s) => s.availableOrders);
  const assignOrderToCell = useDashboardLayoutStore((s) => s.assignOrderToCell);

  if (cellIndex === null) return null;

  return (
    <PlantOrderAssignModal
      open={open}
      cellIndex={cellIndex}
      orders={availableOrders}
      onClose={onClose}
      onSelectOrder={(orderId) => {
        assignOrderToCell(cellIndex, orderId);
        onClose();
      }}
    />
  );
}

export default OrderAssignModalHost;
