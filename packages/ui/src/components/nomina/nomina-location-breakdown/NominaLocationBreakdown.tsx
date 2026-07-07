import type { JSX } from 'react';

import type { NominaLocationBreakdownRow, NominaTheme } from '../shared/nomina-types';
import { NominaLocationCard } from './NominaLocationCard';
import { NominaLocationRow } from './NominaLocationRow';
import styles from './NominaLocationBreakdown.module.scss';

export interface NominaLocationBreakdownProps {
  title: string;
  rows: NominaLocationBreakdownRow[];
  theme?: NominaTheme;
  className?: string;
}

export function NominaLocationBreakdown({
  title,
  rows,
  theme = 'dark',
  className,
}: NominaLocationBreakdownProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Desglose</p>
        <h2 className={styles.title}>{title}</h2>
      </header>
      <div className={styles.tableHead}>
        <span>Sede</span>
        <span>Nómina</span>
        <span>Empleados</span>
        <span>Participación</span>
      </div>
      <div className={styles.desktopRows}>
        {rows.map((row) => (
          <NominaLocationRow key={row.id} row={row} theme={theme} />
        ))}
      </div>
      <div className={styles.mobileCards}>
        {rows.map((row) => (
          <NominaLocationCard key={row.id} row={row} theme={theme} />
        ))}
      </div>
    </section>
  );
}

export default NominaLocationBreakdown;
