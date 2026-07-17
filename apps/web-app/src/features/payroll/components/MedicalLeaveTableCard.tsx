import {
  EmpleadoAvatar,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';

import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_LABELS,
  formatMedicalLeaveCurrency,
  formatMedicalLeaveDate,
} from '../utils/medical-leaves-display';
import { MedicalLeaveRowActions } from './MedicalLeaveRowActions';
import { MedicalLeaveStatusBadge } from './MedicalLeaveStatusBadge';
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
        <MedicalLeaveRowActions
          leave={leave}
          theme={theme}
          canWrite={canWrite}
          downloading={downloading}
          statusBusy={statusBusy}
          onView={onView}
          onDownload={onDownload}
          onRadicate={onRadicate}
          onRecovered={onRecovered}
          onReject={onReject}
        />
      </div>
    </article>
  );
}
