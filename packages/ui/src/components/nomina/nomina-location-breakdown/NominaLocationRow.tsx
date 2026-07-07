import type { JSX } from 'react';

import type { NominaLocationBreakdownRow, NominaTheme } from '../shared/nomina-types';
import { getNominaLocationColor } from '../shared/nomina-utils';
import styles from './NominaLocationRow.module.scss';

export interface NominaLocationRowProps {
  row: NominaLocationBreakdownRow;
  theme?: NominaTheme;
  className?: string;
}

export function NominaLocationRow({
  row,
  theme = 'dark',
  className,
}: NominaLocationRowProps): JSX.Element {
  const accentColor = getNominaLocationColor(row.tone);

  return (
    <div className={[styles.row, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.location}>
        <span className={styles.dot} style={{ backgroundColor: accentColor }} aria-hidden />
        <div>
          <p className={styles.name}>{row.name}</p>
          <p className={styles.city}>{row.city}</p>
        </div>
      </div>
      <p className={styles.amount}>{row.amountLabel}</p>
      <p className={styles.employees}>{row.employeeCountLabel}</p>
      <div className={styles.share}>
        <p className={styles.shareLabel}>{row.shareLabel}</p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={row.progressPercent}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${row.progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>
    </div>
  );
}

export default NominaLocationRow;
