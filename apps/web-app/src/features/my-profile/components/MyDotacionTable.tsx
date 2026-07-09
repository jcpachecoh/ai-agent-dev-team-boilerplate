import { EmpleadoTableHeader, type EmpleadoTheme } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import tableStyles from '@/features/payroll/components/VacationEmpleadoTable.module.scss';
import {
  DOTACION_STATUS_LABELS,
  type DotacionDelivery,
  type DotacionStatus,
} from '@/features/payroll/types/dotaciones.types';
import {
  DOTACION_HISTORY_COLUMNS,
  getDotacionGridTemplate,
  getDotacionTableMinWidthPx,
} from '@/features/payroll/utils/dotacion-table-columns';

import styles from './MyDotacionTable.module.scss';

function formatDeliveryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: DotacionStatus }): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${styles[`status_${status}`]}`}>
      {DOTACION_STATUS_LABELS[status]}
    </span>
  );
}

function formatItemLabel(delivery: DotacionDelivery): string {
  if (!delivery.supplyItem) {
    return 'Sin ítem asignado';
  }

  const talla = delivery.supplyItem.talla ? ` · Talla ${delivery.supplyItem.talla}` : '';
  return `${delivery.supplyItem.nombre}${talla}`;
}

interface Props {
  deliveries: DotacionDelivery[];
  theme?: EmpleadoTheme;
}

export function MyDotacionTable({ deliveries, theme = 'dark' }: Props): React.JSX.Element {
  const gridTemplate = getDotacionGridTemplate(DOTACION_HISTORY_COLUMNS);
  const tableMinWidthPx = getDotacionTableMinWidthPx(DOTACION_HISTORY_COLUMNS);

  if (deliveries.length === 0) {
    return <div className={styles.empty}>Sin registros de dotación.</div>;
  }

  return (
    <section className={tableStyles.table} role="table" aria-label="Historial de dotación">
      <div className={tableStyles.scrollRegion}>
        <div
          className={tableStyles.scrollContent}
          style={
            {
              '--vacation-table-min-width': `${tableMinWidthPx}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={DOTACION_HISTORY_COLUMNS}
            theme={theme}
            className={tableStyles.desktopHeader}
          />
          <div className={tableStyles.body} role="rowgroup">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={tableStyles.row}
                role="row"
                style={{ '--vacation-columns': gridTemplate } as CSSProperties}
              >
                <span className={styles.periodCell} role="cell">
                  {delivery.period}
                </span>
                <span className={styles.itemCell} role="cell">
                  {formatItemLabel(delivery)}
                </span>
                <span className={tableStyles.daysCell} role="cell">
                  {delivery.quantity}
                </span>
                <span className={styles.dateCell} role="cell">
                  {delivery.deliveredAt ? formatDeliveryDate(delivery.deliveredAt) : '—'}
                </span>
                <div className={tableStyles.statusCell} role="cell">
                  <StatusBadge status={delivery.status} />
                </div>
                <div className={tableStyles.actionsCell} role="cell">
                  {delivery.signedReceiptUrl ? (
                    <a
                      className={styles.receiptLink}
                      href={delivery.signedReceiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver comprobante
                    </a>
                  ) : (
                    <span className={tableStyles.emptyAction}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
