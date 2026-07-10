import {
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, X } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { PayrollNovedadSummary } from '../types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '../types/payroll-novedades.types';
import { getPayrollNovedadesGridTemplate } from '../utils/payroll-novedades-table.columns';
import { PayrollNovedadStatusBadge } from './PayrollNovedadStatusBadge';
import styles from './PayrollNovedadTableRow.module.scss';

function formatNovedadDate(value: string): string {
  return value.slice(0, 10);
}

interface Props {
  novedad: PayrollNovedadSummary;
  theme: EmpleadoTheme;
  showActions: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function PayrollNovedadTableRow({
  novedad,
  theme,
  showActions,
  onApprove,
  onReject,
}: Props): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={
        {
          '--empleado-columns': getPayrollNovedadesGridTemplate(),
        } as CSSProperties
      }
    >
      <div className={styles.employeeCell} role="cell">
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(novedad.employeeName)}
          tone={resolveEmpleadoAvatarTone(novedad.employeeId)}
          theme={theme}
          size="md"
        />
        <div className={styles.employeeText}>
          <span className={styles.name}>{novedad.employeeName}</span>
          {novedad.locationName ? (
            <span className={styles.meta}>{novedad.locationName}</span>
          ) : null}
        </div>
      </div>
      <span className={styles.textCell} role="cell">
        {NOVEDAD_TYPE_LABELS[novedad.type]}
      </span>
      <span className={styles.periodCell} role="cell">
        {formatNovedadDate(novedad.startDate)} — {formatNovedadDate(novedad.endDate)}
      </span>
      <div className={styles.statusCell} role="cell">
        <PayrollNovedadStatusBadge status={novedad.status} />
      </div>
      <span className={styles.locationCell} role="cell">
        {novedad.locationName ?? '—'}
      </span>
      <div className={styles.actionsCell} role="cell">
        {showActions ? (
          <>
            <EmpleadoRowActionButton
              variant="toggle"
              active
              theme={theme}
              icon={<Check aria-hidden />}
              onClick={onApprove}
              aria-label="Aprobar novedad"
            />
            <EmpleadoRowActionButton
              variant="view"
              theme={theme}
              icon={<X aria-hidden />}
              onClick={onReject}
              aria-label="Rechazar novedad"
              className={styles.rejectAction}
            />
          </>
        ) : novedad.rejectionReason ? (
          <span className={styles.rejectionHint} title={novedad.rejectionReason}>
            Motivo registrado
          </span>
        ) : (
          <span className={styles.emptyAction}>—</span>
        )}
      </div>
    </div>
  );
}
