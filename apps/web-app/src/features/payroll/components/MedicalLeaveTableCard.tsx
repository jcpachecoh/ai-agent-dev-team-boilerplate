import {
  Button,
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, X } from 'lucide-react';

import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_LABELS,
  canMarkRecovered,
  canRadicateMedicalLeave,
  canRejectMedicalLeave,
  formatMedicalLeaveCurrency,
  formatMedicalLeaveDate,
} from '../utils/medical-leaves-display';
import { MedicalLeaveStatusBadge } from './MedicalLeaveStatusBadge';
import rowStyles from './MedicalLeaveTableRow.module.scss';
import styles from './MedicalLeaveTableCard.module.scss';

interface Props {
  leave: MedicalLeaveSummary;
  theme: EmpleadoTheme;
  canWrite: boolean;
  downloading: boolean;
  statusBusy: boolean;
  onView: () => void;
  onDownload: () => void;
  onRadicate: () => void;
  onRecovered: () => void;
  onReject: () => void;
}

export function MedicalLeaveTableCard({
  leave,
  theme,
  canWrite,
  downloading,
  statusBusy,
  onView,
  onDownload,
  onRadicate,
  onRecovered,
  onReject,
}: Props): React.JSX.Element {
  const payerLabel = leave.origin === 'LABORAL' ? 'ARL' : 'EPS';

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.employeeCell}>
          <EmpleadoAvatar
            initials={resolveEmpleadoInitials(leave.employeeName)}
            tone={resolveEmpleadoAvatarTone(leave.employeeId)}
            theme={theme}
            size="md"
          />
          <div className={styles.employeeText}>
            <p className={styles.name}>{leave.employeeName}</p>
            {leave.locationName ? <p className={styles.meta}>{leave.locationName}</p> : null}
          </div>
        </div>
        <MedicalLeaveStatusBadge status={leave.status} />
      </header>

      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.label}>Origen</span>
          <span className={styles.value}>{LEAVE_ORIGIN_LABELS[leave.origin]}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Días</span>
          <span className={styles.value}>{leave.totalDays}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Periodo</span>
          <span className={styles.value}>
            {formatMedicalLeaveDate(leave.startDate)} — {formatMedicalLeaveDate(leave.endDate)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Empleador</span>
          <span className={styles.value}>{formatMedicalLeaveCurrency(leave.employerAmount)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>{payerLabel}</span>
          <span className={styles.value}>{formatMedicalLeaveCurrency(leave.epsArlAmount)}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onView}>
          Ver detalle
        </Button>
        {leave.supportStorageObjectId ? (
          <Button type="button" variant="secondary" onClick={onDownload} disabled={downloading}>
            Descargar
          </Button>
        ) : null}
        {canWrite && canRadicateMedicalLeave(leave.status, !!leave.supportStorageObjectId) ? (
          <EmpleadoRowActionButton
            variant="toggle"
            active
            theme={theme}
            icon={<Check aria-hidden />}
            onClick={onRadicate}
            disabled={statusBusy}
            aria-label="Radicar incapacidad"
          />
        ) : null}
        {canWrite && canMarkRecovered(leave.status) ? (
          <Button type="button" variant="secondary" onClick={onRecovered} disabled={statusBusy}>
            Recobrada
          </Button>
        ) : null}
        {canWrite && canRejectMedicalLeave(leave.status) ? (
          <EmpleadoRowActionButton
            variant="view"
            theme={theme}
            icon={<X aria-hidden />}
            onClick={onReject}
            aria-label="Rechazar incapacidad"
            className={rowStyles.rejectAction}
          />
        ) : null}
      </div>
    </article>
  );
}
