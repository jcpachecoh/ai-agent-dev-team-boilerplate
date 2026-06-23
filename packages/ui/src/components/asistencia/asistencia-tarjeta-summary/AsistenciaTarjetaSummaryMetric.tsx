import type { JSX } from 'react';

import { RecetaMetricCard, type RecetaMetricCardVariant } from '../../receta/receta-metric-card';
import type {
  AsistenciaTarjetaMetricData,
  AsistenciaTarjetaSummaryVariant,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaSummaryMetric.module.scss';

export interface AsistenciaTarjetaSummaryMetricProps {
  label: string;
  value: string;
  variant?: AsistenciaTarjetaSummaryVariant;
  theme?: AsistenciaTheme;
  className?: string;
}

const variantToReceta: Record<AsistenciaTarjetaSummaryVariant, RecetaMetricCardVariant> = {
  ordinary: 'type-1',
  unworked: 'type-4',
  overtime: 'type-3',
  permission: 'type-2',
  absence: 'type-4',
};

export function AsistenciaTarjetaSummaryMetric({
  label,
  value,
  variant = 'ordinary',
  theme = 'dark',
  className,
}: AsistenciaTarjetaSummaryMetricProps): JSX.Element {
  return (
    <RecetaMetricCard
      theme={theme}
      size="sm"
      title={label}
      value={value}
      variant={variantToReceta[variant]}
      showIcon={false}
      className={[styles.metricCard, className].filter(Boolean).join(' ')}
    />
  );
}

export interface AsistenciaTarjetaSummaryProps {
  metrics: AsistenciaTarjetaMetricData[];
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaTarjetaSummary({
  metrics,
  theme = 'dark',
  className,
}: AsistenciaTarjetaSummaryProps): JSX.Element {
  return (
    <section
      className={[styles.grid, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      aria-label="Indicadores del período"
    >
      {metrics.map((metric) => (
        <AsistenciaTarjetaSummaryMetric
          key={metric.id}
          label={metric.label}
          value={metric.value}
          variant={metric.variant}
          theme={theme}
        />
      ))}
    </section>
  );
}

export default AsistenciaTarjetaSummaryMetric;
