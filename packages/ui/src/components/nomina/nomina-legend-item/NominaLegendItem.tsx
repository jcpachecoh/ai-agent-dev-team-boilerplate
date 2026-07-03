import type { JSX } from 'react';

import type { NominaTheme } from '../shared/nomina-types';
import styles from './NominaLegendItem.module.scss';

export interface NominaLegendItemProps {
  label: string;
  color: string;
  theme?: NominaTheme;
  className?: string;
}

export function NominaLegendItem({
  label,
  color,
  theme = 'dark',
  className,
}: NominaLegendItemProps): JSX.Element {
  return (
    <span className={[styles.item, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <span className={styles.dot} style={{ backgroundColor: color }} aria-hidden />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default NominaLegendItem;
