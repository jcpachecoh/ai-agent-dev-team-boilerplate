import type { LeaveStatus } from '../types/medical-leaves.types';
import { LEAVE_STATUS_LABELS } from '../utils/medical-leaves-display';
import styles from './MedicalLeaveStatusBadge.module.scss';

const STATUS_CLASS: Record<LeaveStatus, string> = {
  REGISTRADA: styles.registrada,
  RADICADA_EPS: styles.radicada,
  RECOBRADA: styles.recobrada,
  RECHAZADA: styles.rechazada,
};

interface Props {
  status: LeaveStatus;
}

export function MedicalLeaveStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{LEAVE_STATUS_LABELS[status]}</span>
  );
}
