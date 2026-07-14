import styles from './CesantiasStatusBadge.module.scss';
import type { CesantiasSettlementStatus } from '../types/cesantias.types';
import { CESANTIAS_STATUS_LABELS } from '../utils/cesantias-display';

const STATUS_CLASS: Record<CesantiasSettlementStatus, string> = {
  CALCULADA: styles.calculada,
  CONSIGNADA: styles.consignada,
  ANULADA: styles.anulada,
};

interface Props {
  status: CesantiasSettlementStatus;
}

export function CesantiasStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {CESANTIAS_STATUS_LABELS[status]}
    </span>
  );
}
