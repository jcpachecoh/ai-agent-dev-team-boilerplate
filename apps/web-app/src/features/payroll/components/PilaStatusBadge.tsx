import styles from './PilaStatusBadge.module.scss';
import type { PilaUiStatus } from '../types/pila.types';
import { PILA_STATUS_LABELS } from '../utils/pila-display';

const STATUS_CLASS: Record<PilaUiStatus, string> = {
  PENDING: styles.pending,
  VALIDATION_FAILED: styles.failed,
  GENERATED: styles.generated,
  PAID: styles.paid,
  VOIDED: styles.voided,
};

interface Props {
  status: PilaUiStatus;
}

export function PilaStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{PILA_STATUS_LABELS[status]}</span>
  );
}
