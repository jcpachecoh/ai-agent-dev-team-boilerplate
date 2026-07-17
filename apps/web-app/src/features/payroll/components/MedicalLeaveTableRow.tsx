import {
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, DollarSign, Download, X } from 'lucide-react';
import type { CSSProperties } from 'react';

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
  const showActions = canWrite;

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
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          <EmpleadoRowActionButton
            variant="view"
            theme={theme}
            onClick={onView}
            title="Ver"
            aria-label="Ver detalle de incapacidad"
          />
          {leave.supportStorageObjectId ? (
            <EmpleadoRowActionButton
              variant="history"
              theme={theme}
              onClick={onDownload}
              disabled={downloading}
              title="Descargar"
              aria-label="Descargar soporte médico"
              icon={<Download aria-hidden />}
            />
          ) : null}
          {canRadicateMedicalLeave(leave.status, !!leave.supportStorageObjectId) ? (
            <EmpleadoRowActionButton
              variant="toggle"
              active
              theme={theme}
              icon={<Check aria-hidden />}
              onClick={onRadicate}
              disabled={statusBusy}
              title="Radicar"
              aria-label="Radicar incapacidad"
            />
          ) : null}
          {canMarkRecovered(leave.status) ? (
            <EmpleadoRowActionButton
              variant="toggle"
              active
              theme={theme}
              icon={<DollarSign aria-hidden />}
              onClick={onRecovered}
              disabled={statusBusy}
              title="Recobrar"
              aria-label="Marcar incapacidad como recobrada"
              className={styles.recoverAction}
            />
          ) : null}
          {canRejectMedicalLeave(leave.status) ? (
            <EmpleadoRowActionButton
              variant="view"
              theme={theme}
              icon={<X aria-hidden />}
              onClick={onReject}
              title="Rechazar"
              aria-label="Rechazar incapacidad"
              className={styles.rejectAction}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
