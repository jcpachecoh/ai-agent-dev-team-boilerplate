import {
  EmpleadoAvatar,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_LABELS,
  formatMedicalLeaveCurrency,
  formatMedicalLeaveDate,
} from '../utils/medical-leaves-display';
import { MedicalLeaveRowActions } from './MedicalLeaveRowActions';
import { MedicalLeaveStatusBadge } from './MedicalLeaveStatusBadge';
import styles from './MedicalLeaveTableRow.module.scss';

interface Props {
  leave: MedicalLeaveSummary;
  theme: EmpleadoTheme;
  gridTemplate: string;
  canWrite: boolean;
  downloading: boolean;
  statusBusy: boolean;
  onView: () => void;
  onDownload: () => void;
  onRadicate: () => void;
  onRecovered: () => void;
  onReject: () => void;
}

export function MedicalLeaveTableRow({
  leave,
  theme,
  gridTemplate,
  canWrite,
  downloading,
  statusBusy,
  onView,
  onDownload,
  onRadicate,
  onRecovered,
  onReject,
}: Props): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={
        {
          '--empleado-columns': gridTemplate,
        } as CSSProperties
      }
    >
      <div className={styles.employeeCell} role="cell">
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(leave.employeeName)}
          tone={resolveEmpleadoAvatarTone(leave.employeeId)}
          theme={theme}
          size="md"
        />
        <div className={styles.employeeText}>
          <span className={styles.name}>{leave.employeeName}</span>
          {leave.locationName ? <span className={styles.meta}>{leave.locationName}</span> : null}
        </div>
      </div>
      <span className={styles.textCell} role="cell">
        {LEAVE_ORIGIN_LABELS[leave.origin]}
      </span>
      <span className={styles.periodCell} role="cell">
        {formatMedicalLeaveDate(leave.startDate)} — {formatMedicalLeaveDate(leave.endDate)}
      </span>
      <span className={styles.centerCell} role="cell">
        {leave.totalDays}
      </span>
      <span className={styles.amountCell} role="cell">
        {formatMedicalLeaveCurrency(leave.employerAmount)}
      </span>
      <span className={styles.amountCell} role="cell">
        {formatMedicalLeaveCurrency(leave.epsArlAmount)}
      </span>
      <div className={styles.statusCell} role="cell">
        <MedicalLeaveStatusBadge status={leave.status} />
      </div>
      {canWrite ? (
        <div className={styles.actionsCell} role="cell">
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
      ) : null}
    </div>
  );
}
