import {
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, X } from 'lucide-react';
import type { CSSProperties } from 'react';

import { OvertimeStatusBadge } from './OvertimeStatusBadge';
import styles from './OvertimeTableRow.module.scss';
import { OVERTIME_TYPE_LABELS, type OvertimeRequestItem } from '../types/overtime.types';
import { getOvertimeGridTemplate } from '../utils/overtime-table.columns';

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-CO');
}

function formatWorkDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  // DATE often arrives as YYYY-MM-DD or ISO midnight
  const day = value.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) {
    return value;
  }
  return `${d}/${m}/${y}`;
}

function formatWindowCell(item: OvertimeRequestItem): string {
  if (item.type === 'SOLICITUD_ADMINISTRATIVA') {
    const date = formatWorkDate(item.workDate);
    const start = item.proposedStartTime
      ? new Date(item.proposedStartTime).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
    const end = item.proposedEndTime
      ? new Date(item.proposedEndTime).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
    const minutes =
      item.proposedMinutes !== null && item.proposedMinutes !== undefined
        ? ` · ${item.proposedMinutes} min`
        : '';
    return `${date} ${start}–${end}${minutes}`;
  }

  return `${formatDateTime(item.shiftEndTime)} → ${formatDateTime(item.actualEndTime)}`;
}

interface Props {
  item: OvertimeRequestItem;
  theme: EmpleadoTheme;
  showActions: boolean;
  actionsDisabled?: boolean;
  onApprove: () => void;
  onObject: () => void;
}

export function OvertimeTableRow({
  item,
  theme,
  showActions,
  actionsDisabled = false,
  onApprove,
  onObject,
}: Props): React.JSX.Element {
  const type = item.type ?? 'DETECCION_AUTOMATICA';
  const minutesLabel =
    type === 'SOLICITUD_ADMINISTRATIVA'
      ? (item.proposedMinutes ?? '—')
      : (item.accumulatedMinutes ?? '—');

  return (
    <div
      className={styles.row}
      role="row"
      style={
        {
          '--empleado-columns': getOvertimeGridTemplate(),
        } as CSSProperties
      }
    >
      <div className={styles.employeeCell} role="cell">
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(item.employeeName)}
          tone={resolveEmpleadoAvatarTone(item.employeeId)}
          theme={theme}
          size="md"
        />
        <div className={styles.employeeText}>
          <span className={styles.name}>{item.employeeName}</span>
          <span className={styles.meta}>{item.payrollPeriod ?? '—'}</span>
        </div>
      </div>
      <span className={styles.textCell} role="cell">
        {item.locationName}
      </span>
      <span className={styles.textCell} role="cell">
        {OVERTIME_TYPE_LABELS[type]}
      </span>
      <span className={`${styles.monoCell} ${styles.centerCell}`} role="cell">
        {minutesLabel}
      </span>
      <span className={styles.monoCell} role="cell">
        {formatWindowCell(item)}
      </span>
      <div className={styles.centerCell} role="cell">
        <OvertimeStatusBadge status={item.status} />
      </div>
      <div className={styles.actionsCell} role="cell">
        {showActions ? (
          <>
            <EmpleadoRowActionButton
              variant="toggle"
              active
              theme={theme}
              icon={<Check aria-hidden />}
              onClick={onApprove}
              disabled={actionsDisabled}
              aria-label="Aprobar tiempo extra"
            />
            <EmpleadoRowActionButton
              variant="view"
              theme={theme}
              icon={<X aria-hidden />}
              onClick={onObject}
              disabled={actionsDisabled}
              aria-label="Objetar tiempo extra"
              className={styles.rejectAction}
            />
          </>
        ) : (
          <span className={styles.emptyAction}>—</span>
        )}
      </div>
    </div>
  );
}
