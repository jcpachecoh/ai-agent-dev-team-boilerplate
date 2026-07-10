import {
  EmpleadoAvatar,
  EmpleadoRowActionButton,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import { Check, X } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { OvertimeRequestItem } from '../types/overtime.types';
import { getOvertimeGridTemplate } from '../utils/overtime-table.columns';
import { OvertimeStatusBadge } from './OvertimeStatusBadge';
import styles from './OvertimeTableRow.module.scss';

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-CO');
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
      <span className={`${styles.monoCell} ${styles.centerCell}`} role="cell">
        {item.accumulatedMinutes}
      </span>
      <span className={styles.monoCell} role="cell">
        {formatDateTime(item.shiftEndTime)}
      </span>
      <span className={styles.monoCell} role="cell">
        {formatDateTime(item.actualEndTime)}
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
