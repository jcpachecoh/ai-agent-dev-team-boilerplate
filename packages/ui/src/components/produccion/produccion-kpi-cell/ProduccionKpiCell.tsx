import React, { type JSX, type ReactNode } from 'react';

import styles from './ProduccionKpiCell.module.scss';
import type { ProduccionAccent, ProduccionSize, ProduccionTheme } from '../shared/produccion-types';

export interface ProduccionKpiCellProps {
  label?: string;
  value?: string;
  unit?: string;
  delta?: string;
  accent?: ProduccionAccent;
  icon?: ReactNode;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionKpiCell({
  label = 'Throughput',
  value = '42',
  unit = 'u/h',
  delta = '▲ +3.2% vs ayer',
  accent = 'gold',
  icon,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionKpiCellProps): JSX.Element {
  return (
    <section
      className={[
        styles.cell,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`accent--${accent}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.labelRow}>
        <span>{label}</span>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <div className={styles.valueRow}>
        <strong>{value}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>
      {delta ? <p className={styles.delta}>{delta}</p> : null}
    </section>
  );
}

export default ProduccionKpiCell;
