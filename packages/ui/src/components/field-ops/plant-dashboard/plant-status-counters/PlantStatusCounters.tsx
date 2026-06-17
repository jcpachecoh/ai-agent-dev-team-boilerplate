import type { JSX } from 'react';

import type {
  PlantDashboardThemeProps,
  PlantStatusCounts,
} from '../shared/plant-workstation-types';
import styles from './PlantStatusCounters.module.scss';

export interface PlantStatusCountersProps extends PlantDashboardThemeProps {
  counts: PlantStatusCounts;
}

const COUNTER_ITEMS: Array<{
  key: keyof PlantStatusCounts;
  label: string;
  tone: string;
}> = [
  { key: 'inProgress', label: 'EN PROCESO', tone: 'teal' },
  { key: 'paused', label: 'PAUSADAS', tone: 'amber' },
  { key: 'incidents', label: 'NOVEDADES', tone: 'red' },
  { key: 'pending', label: 'PENDIENTES', tone: 'blue' },
];

export function PlantStatusCounters({
  counts,
  theme = 'dark',
  size = 'md',
  className,
}: PlantStatusCountersProps): JSX.Element {
  return (
    <div
      className={[styles.counters, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Resumen de estaciones"
    >
      {COUNTER_ITEMS.map(({ key, label, tone }) => (
        <div key={key} className={styles.item}>
          <span className={[styles.value, styles[`tone--${tone}`]].join(' ')}>{counts[key]}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default PlantStatusCounters;
