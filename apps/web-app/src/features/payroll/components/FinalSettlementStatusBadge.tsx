import styles from './FinalSettlementStatusBadge.module.scss';
import type { FinalSettlementStatus } from '../types/final-settlement.types';
import { FINAL_SETTLEMENT_STATUS_LABELS } from '../utils/final-settlement-display';

const STATUS_CLASS: Record<FinalSettlementStatus, string> = {
  DRAFT: styles.draft,
  CALCULATED: styles.calculated,
  APPROVED: styles.approved,
  PAID: styles.paid,
  VOIDED: styles.voided,
};

interface Props {
  status: FinalSettlementStatus;
}

export function FinalSettlementStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {FINAL_SETTLEMENT_STATUS_LABELS[status]}
    </span>
  );
}
