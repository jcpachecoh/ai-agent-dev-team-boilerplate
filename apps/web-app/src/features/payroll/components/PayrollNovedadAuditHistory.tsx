import type { NovedadAuditLogRecord } from '../types/payroll-novedades.types';
import {
  describeNovedadAuditChanges,
  formatNovedadAuditTimestamp,
} from '../utils/payroll-novedad-audit-display.util';
import styles from './PayrollNovedadAuditHistory.module.scss';

interface Props {
  entries: NovedadAuditLogRecord[];
  isLoading: boolean;
  isError: boolean;
}

export function PayrollNovedadAuditHistory({
  entries,
  isLoading,
  isError,
}: Props): React.JSX.Element {
  return (
    <div className={styles.section}>
      <p className={styles.title}>Historial de cambios</p>

      {isLoading ? (
        <p className={styles.helperText}>Cargando historial…</p>
      ) : isError ? (
        <p className={styles.helperText}>No se pudo cargar el historial.</p>
      ) : entries.length === 0 ? (
        <p className={styles.helperText}>Sin ediciones registradas.</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => {
            const changes = describeNovedadAuditChanges(entry.previousValue, entry.newValue);

            return (
              <li key={entry.id} className={styles.entry}>
                <p className={styles.meta}>
                  {entry.changedByName ?? entry.changedBy} ·{' '}
                  {formatNovedadAuditTimestamp(entry.changedAt)}
                </p>

                {changes.length === 0 ? (
                  <p className={styles.noChanges}>Edición sin cambios visibles.</p>
                ) : (
                  <ul className={styles.changes}>
                    {changes.map((change) => (
                      <li key={`${entry.id}-${change.field}`} className={styles.changeRow}>
                        <span className={styles.fieldLabel}>{change.label}</span>
                        <div className={styles.changeValues}>
                          <span className={styles.fromValue}>{change.from}</span>
                          <span className={styles.arrow} aria-hidden>
                            →
                          </span>
                          <span className={styles.toValue}>{change.to}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
