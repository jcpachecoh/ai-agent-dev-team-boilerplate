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
  hint: string;
}> = [
  {
    key: 'inProgress',
    label: 'EN PROCESO',
    tone: 'teal',
    hint: 'Estaciones con orden en ejecución',
  },
  {
    key: 'paused',
    label: 'PAUSADAS',
    tone: 'amber',
    hint: 'Estaciones con proceso pausado',
  },
  {
    key: 'incidents',
    label: 'NOVEDADES',
    tone: 'red',
    hint: 'Estaciones con novedad reportada',
  },
  {
    key: 'pending',
    label: 'SIN INICIAR',
    tone: 'blue',
    hint: 'Órdenes asignadas que aún no se han iniciado',
  },
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
      {COUNTER_ITEMS.map(({ key, label, tone, hint }) => (
        <div key={key} className={styles.item} title={hint}>
          <span className={[styles.value, styles[`tone--${tone}`]].join(' ')}>{counts[key]}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default PlantStatusCounters;
