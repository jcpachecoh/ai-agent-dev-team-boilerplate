import { X } from 'lucide-react';
import type { JSX } from 'react';

import type {
  PlantAvailableOrder,
  PlantDashboardThemeProps,
} from '../shared/plant-workstation-types';
import { PLANT_STATUS_ACCENT, PLANT_STATUS_LABELS } from '../shared/plant-workstation-types';
import styles from './PlantOrderAssignModal.module.scss';

export interface PlantOrderAssignModalProps extends PlantDashboardThemeProps {
  open: boolean;
  cellIndex: number;
  orders: PlantAvailableOrder[];
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
}

export function PlantOrderAssignModal({
  open,
  cellIndex,
  orders,
  onClose,
  onSelectOrder,
  theme = 'dark',
  className,
}: PlantOrderAssignModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className={[styles.overlay, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      role="presentation"
      onClick={onClose}
      data-testid="plant-order-assign-modal"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-assign-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.cellLabel}>Celda {cellIndex + 1}</p>
            <h2 id="order-assign-title" className={styles.title}>
              Asignar orden de producción
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className={styles.list}>
          {orders.length === 0 ? (
            <p className={styles.empty}>No hay órdenes disponibles</p>
          ) : (
            orders.map((order) => {
              const accent = PLANT_STATUS_ACCENT[order.status];
              const statusLabel = PLANT_STATUS_LABELS[order.status];
              return (
                <button
                  key={order.orderId}
                  type="button"
                  className={styles.row}
                  style={{ '--row-accent': accent } as React.CSSProperties}
                  onClick={() => onSelectOrder(order.orderId)}
                >
                  <span className={styles.rowDotWrap} aria-hidden>
                    <span className={styles.rowDot} />
                  </span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTop}>
                      <span className={styles.rowOp} style={{ color: accent }}>
                        {order.orderNumber ?? order.orderId}
                      </span>
                      {order.priority === 'urgent' ? (
                        <span className={styles.urgent}>URGENTE</span>
                      ) : null}
                    </span>
                    <span className={styles.rowProduct}>{order.productName}</span>
                    <span className={styles.rowMeta}>
                      {order.recipeName} · Paso {order.phaseIndex}/{order.phaseTotal} ·{' '}
                      {order.stationId}
                    </span>
                  </span>
                  <span className={styles.rowBadge} style={{ color: accent, borderColor: accent }}>
                    {statusLabel}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PlantOrderAssignModal;
