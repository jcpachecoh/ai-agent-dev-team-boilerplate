import styles from './SenaQuotaStatusBadge.module.scss';
import type { SenaQuotaStatus } from '../types/payroll-reports.types';
import { SENA_QUOTA_STATUS_LABELS } from '../utils/sena-quota-display';

const STATUS_CLASS: Record<SenaQuotaStatus, string> = {
  EXEMPT: styles.exempt,
  COMPLIANT: styles.compliant,
  PENDING: styles.pending,
};

interface Props {
  status: SenaQuotaStatus;
}

export function SenaQuotaStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {SENA_QUOTA_STATUS_LABELS[status]}
    </span>
  );
}
