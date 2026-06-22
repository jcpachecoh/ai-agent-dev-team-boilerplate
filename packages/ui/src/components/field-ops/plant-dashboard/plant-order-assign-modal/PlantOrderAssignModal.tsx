import { X } from 'lucide-react';
import type { JSX } from 'react';

import { PlantDashboardModalPortal } from '../shared/PlantDashboardModalPortal';
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
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
}

const SKELETON_ROW_COUNT = 4;

function OrderAssignSkeletonRows(): JSX.Element {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <div key={index} className={styles.skeletonRow} aria-hidden>
          <span className={styles.skeletonDotWrap} />
          <span className={styles.skeletonBody}>
            <span className={styles.skeletonLineShort} />
            <span className={styles.skeletonLineTitle} />
            <span className={styles.skeletonLineMeta} />
          </span>
          <span className={styles.skeletonBadge} />
        </div>
      ))}
    </>
  );
}

export function PlantOrderAssignModal({
  open,
  cellIndex,
  orders,
  isLoading = false,
  errorMessage = null,
  onRetry,
  onClose,
  onSelectOrder,
  theme = 'dark',
  size = 'md',
  className,
}: PlantOrderAssignModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <PlantDashboardModalPortal open={open}>
      <div
        className={[styles.overlay, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
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

          <div
            className={styles.list}
            aria-busy={isLoading}
            aria-live="polite"
            data-testid={isLoading ? 'order-assign-loading' : undefined}
          >
            {isLoading ? (
              <>
                <p className={styles.loadingHint} role="status">
                  Cargando órdenes disponibles…
                </p>
                <OrderAssignSkeletonRows />
              </>
            ) : errorMessage ? (
              <div className={styles.errorState} data-testid="order-assign-error">
                <p className={styles.errorMessage}>{errorMessage}</p>
                {onRetry ? (
                  <button type="button" className={styles.retryBtn} onClick={onRetry}>
                    Reintentar
                  </button>
                ) : null}
              </div>
            ) : orders.length === 0 ? (
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
                    <span
                      className={styles.rowBadge}
                      style={{ color: accent, borderColor: accent }}
                    >
                      {statusLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PlantDashboardModalPortal>
  );
}

export default PlantOrderAssignModal;
