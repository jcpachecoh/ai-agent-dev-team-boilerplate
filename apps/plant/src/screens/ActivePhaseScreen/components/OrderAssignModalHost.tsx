import { PlantOrderAssignModal } from '@restopsiq/ui';
import { useEffect, useMemo, type JSX } from 'react';

import { useAvailableProductionOrders } from '@/hooks/useAvailableProductionOrders';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';

import styles from './OrderAssignModalHost.module.scss';

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

  const { data, isLoading, isError, refetch, isFetching } = useAvailableProductionOrders(open);

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

  if (cellIndex === null) return null;

  return (
    <>
      <PlantOrderAssignModal
        open={open}
        cellIndex={cellIndex}
        orders={orders}
        onClose={onClose}
        onSelectOrder={(orderId) => {
          const order = orders.find((item) => item.orderId === orderId);
          if (!order) return;
          assignOrderToCell(cellIndex, order);
          onClose();
        }}
      />

      {open && (isLoading || isFetching) ? (
        <div className={styles.loadingOverlay} data-testid="order-assign-loading">
          Cargando órdenes…
        </div>
      ) : null}

      {open && isError && !isLoading ? (
        <div className={styles.errorBanner} data-testid="order-assign-error">
          <span>No se pudieron cargar las órdenes.</span>
          <button type="button" onClick={() => void refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}
    </>
  );
}

export default OrderAssignModalHost;
