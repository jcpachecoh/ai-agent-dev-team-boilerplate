import { formatCurrencyCop } from '../utils/cesantias-display';
import styles from './CesantiasTableTotalsRow.module.scss';

interface Props {
  totals: { cesantias: number; interest: number };
  gridTemplate: string;
}

export function CesantiasTableTotalsRow({ totals, gridTemplate }: Props): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--empleado-columns': gridTemplate } as React.CSSProperties}
    >
      <span className={styles.labelCell} style={{ gridColumn: '1 / 6' }} role="cell">
        Totales
      </span>
      <span className={styles.amountCell} style={{ gridColumn: 6 }} role="cell">
        {formatCurrencyCop(String(totals.cesantias))}
      </span>
      <span className={styles.amountCell} style={{ gridColumn: 7 }} role="cell">
        {formatCurrencyCop(String(totals.interest))}
      </span>
    </div>
  );
}
