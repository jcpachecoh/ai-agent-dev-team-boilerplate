import {
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, X } from 'lucide-react';

import type { PayrollNovedadSummary } from '../types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '../types/payroll-novedades.types';
import { PayrollNovedadStatusBadge } from './PayrollNovedadStatusBadge';
import rowStyles from './PayrollNovedadTableRow.module.scss';
import styles from './PayrollNovedadTableCard.module.scss';

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

export function PayrollNovedadTableCard({
  novedad,
  theme,
  showActions,
  onApprove,
  onReject,
}: Props): React.JSX.Element {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.employeeCell}>
          <EmpleadoAvatar
            initials={resolveEmpleadoInitials(novedad.employeeName)}
            tone={resolveEmpleadoAvatarTone(novedad.employeeId)}
            theme={theme}
            size="md"
          />
          <div className={styles.employeeText}>
            <p className={styles.name}>{novedad.employeeName}</p>
            {novedad.locationName ? <p className={styles.meta}>{novedad.locationName}</p> : null}
          </div>
        </div>
        <PayrollNovedadStatusBadge status={novedad.status} />
      </header>

      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.label}>Tipo</span>
          <span className={styles.value}>{NOVEDAD_TYPE_LABELS[novedad.type]}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Sede</span>
          <span className={styles.value}>{novedad.locationName ?? '—'}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Fechas</span>
          <span className={styles.value}>
            {formatNovedadDate(novedad.startDate)} — {formatNovedadDate(novedad.endDate)}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
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
              className={rowStyles.rejectAction}
            />
          </>
        ) : novedad.rejectionReason ? (
          <span className={styles.rejectionHint} title={novedad.rejectionReason}>
            Motivo registrado
          </span>
        ) : null}
      </div>
    </article>
  );
}
