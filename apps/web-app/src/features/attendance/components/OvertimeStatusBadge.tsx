import type { OvertimeStatus } from '../types/overtime.types';
import { OVERTIME_STATUS_LABELS } from '../types/overtime.types';
import styles from './OvertimeStatusBadge.module.scss';

const STATUS_CLASS: Record<OvertimeStatus, string> = {
  PENDIENTE_ADMIN: styles.pendingAdmin,
  PENDIENTE_GERENCIA_OPERACIONES: styles.pendingOps,
  PENDIENTE_GERENCIA_GENERAL: styles.pendingGg,
  APROBADA: styles.approved,
  OBJETADA: styles.objected,
};

interface Props {
  status: OvertimeStatus;
}

export function OvertimeStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {OVERTIME_STATUS_LABELS[status]}
    </span>
  );
}
