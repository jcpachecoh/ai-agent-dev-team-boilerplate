import { useEmployeeDotacionHistoryQuery } from '../hooks/useDotacionesQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import { DOTACION_STATUS_LABELS } from '../types/dotaciones.types';
import type { DotacionDelivery } from '../types/dotaciones.types';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeDotacionesTab.module.scss';

interface Props {
  userId: string;
  theme: 'light' | 'dark';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: DotacionDelivery['status'] }): React.JSX.Element {
  const cls =
    status === 'ENTREGADA'
      ? styles.entregada
      : status === 'NO_APLICA'
        ? styles.noAplica
        : styles.pendiente;
  return <span className={`${styles.badge} ${cls}`}>{DOTACION_STATUS_LABELS[status]}</span>;
}

export function PayrollEmployeeDotacionesTab({ userId, theme: _theme }: Props): React.JSX.Element {
  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;

  const historyQuery = useEmployeeDotacionHistoryQuery(employeeId);

  if (employeeQuery.isLoading || historyQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  const deliveries = historyQuery.data?.edges ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Historial de dotación</span>
      </div>

      {deliveries.length === 0 ? (
        <div className={styles.empty}>Sin registros de dotación</div>
      ) : (
        <div className={styles.list}>
          {deliveries.map((delivery) => (
            <div key={delivery.id} className={styles.card}>
              <div className={styles.cardMain}>
                <span className={styles.cardPeriod}>{delivery.period}</span>
                {delivery.supplyItem ? (
                  <span className={styles.cardItem}>
                    {delivery.supplyItem.nombre}
                    {delivery.supplyItem.talla ? ` · Talla ${delivery.supplyItem.talla}` : ''}
                  </span>
                ) : (
                  <span
                    className={styles.cardItem}
                    style={{ color: 'var(--empleado-muted, #888)' }}
                  >
                    Sin ítem asignado
                  </span>
                )}
                <span className={styles.cardMeta}>
                  {delivery.deliveredAt
                    ? `Entregado ${formatDate(delivery.deliveredAt)} · Cant. ${delivery.quantity}`
                    : `Cantidad: ${delivery.quantity}`}
                  {delivery.noAplicaReason ? ` · ${delivery.noAplicaReason}` : ''}
                </span>
                {delivery.signedReceiptUrl ? (
                  <a
                    className={styles.cardReceipt}
                    href={delivery.signedReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver comprobante
                  </a>
                ) : null}
              </div>
              <StatusBadge status={delivery.status} />
            </div>
          ))}
        </div>
      )}

      {historyQuery.data?.pageInfo.hasNextPage ? (
        <div className={styles.loadMore}>
          <button
            type="button"
            className={styles.btnMore}
            onClick={() => void historyQuery.refetch()}
          >
            Cargar más
          </button>
        </div>
      ) : null}
    </div>
  );
}
