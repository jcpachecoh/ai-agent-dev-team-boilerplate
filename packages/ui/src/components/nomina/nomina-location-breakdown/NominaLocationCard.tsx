import type { JSX } from 'react';

import type { NominaLocationBreakdownRow, NominaTheme } from '../shared/nomina-types';
import { getNominaLocationColor } from '../shared/nomina-utils';
import styles from './NominaLocationCard.module.scss';

export interface NominaLocationCardProps {
  row: NominaLocationBreakdownRow;
  theme?: NominaTheme;
  className?: string;
}

export function NominaLocationCard({
  row,
  theme = 'dark',
  className,
}: NominaLocationCardProps): JSX.Element {
  const accentColor = getNominaLocationColor(row.tone);

  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <header className={styles.header}>
        <span className={styles.dot} style={{ backgroundColor: accentColor }} aria-hidden />
        <div>
          <p className={styles.name}>{row.name}</p>
          <p className={styles.city}>{row.city}</p>
        </div>
      </header>
      <dl className={styles.stats}>
        <div>
          <dt>Nómina</dt>
          <dd>{row.amountLabel}</dd>
        </div>
        <div>
          <dt>Empleados</dt>
          <dd>{row.employeeCountLabel}</dd>
        </div>
        <div>
          <dt>Participación</dt>
          <dd>{row.shareLabel}</dd>
        </div>
      </dl>
      <div className={styles.progressTrack} role="progressbar" aria-valuenow={row.progressPercent}>
        <div
          className={styles.progressFill}
          style={{ width: `${row.progressPercent}%`, backgroundColor: accentColor }}
        />
      </div>
    </article>
  );
}

export default NominaLocationCard;
