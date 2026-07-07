import type { JSX } from 'react';

import { NominaKpiCard } from '../nomina-kpi-card';
import type { NominaKpiMetric, NominaTheme } from '../shared/nomina-types';
import styles from './NominaKpiGrid.module.scss';

export interface NominaKpiGridProps {
  metrics: NominaKpiMetric[];
  theme?: NominaTheme;
  className?: string;
}

export function NominaKpiGrid({
  metrics,
  theme = 'dark',
  className,
}: NominaKpiGridProps): JSX.Element {
  return (
    <div className={[styles.grid, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      {metrics.map((metric) => (
        <NominaKpiCard
          key={metric.id}
          theme={theme}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          tone={metric.tone}
        />
      ))}
    </div>
  );
}

export default NominaKpiGrid;
