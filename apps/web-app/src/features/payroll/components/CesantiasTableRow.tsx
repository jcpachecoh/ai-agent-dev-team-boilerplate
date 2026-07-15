import type { CSSProperties } from 'react';

import type { CesantiasLiquidation } from '../types/cesantias.types';
import { CESANTIAS_INTEREST_STATUS_LABELS, formatCurrencyCop } from '../utils/cesantias-display';
import { CesantiasFundChannelBadge } from './CesantiasFundChannelBadge';
import { CesantiasStatusBadge } from './CesantiasStatusBadge';
import styles from './CesantiasTableRow.module.scss';

interface Props {
  item: CesantiasLiquidation;
  gridTemplate: string;
}

export function CesantiasTableRow({ item, gridTemplate }: Props): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--empleado-columns': gridTemplate } as CSSProperties}
    >
      <span className={styles.employeeCell} role="cell">
        {item.employeeName}
      </span>
      <span className={styles.textCell} role="cell">
        {item.fundNameSnapshot}
      </span>
      <div className={styles.channelCell} role="cell">
        <CesantiasFundChannelBadge channel={item.fundChannelSnapshot} />
      </div>
      <span className={styles.amountCell} role="cell">
        {formatCurrencyCop(item.calculationBase)}
      </span>
      <span className={styles.centerCell} role="cell">
        {item.accrualDays}
      </span>
      <span className={styles.amountCell} role="cell">
        {formatCurrencyCop(item.cesantiasAmount)}
      </span>
      <span className={styles.amountCell} role="cell">
        {formatCurrencyCop(item.interestAmount)}
      </span>
      <div className={styles.statusCell} role="cell">
        <CesantiasStatusBadge status={item.cesantiasStatus} />
      </div>
      <span className={styles.textCell} role="cell">
        {CESANTIAS_INTEREST_STATUS_LABELS[item.interestStatus]}
      </span>
    </div>
  );
}
