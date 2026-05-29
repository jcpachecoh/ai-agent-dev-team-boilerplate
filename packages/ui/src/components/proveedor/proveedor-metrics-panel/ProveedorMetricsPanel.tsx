import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorMetricsPanel.module.scss';

export interface ProveedorMetricField {
  label: string;
  value: string;
}

export interface ProveedorMetricsPanelProps {
  title?: string;
  metrics?: ProveedorMetricField[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const defaultMetrics: ProveedorMetricField[] = [
  { label: 'CONFIABILIDAD', value: '4.8 ★' },
  { label: 'LEAD TIME PROMEDIO', value: '24h' },
  { label: 'CONDICIÓN PAGO', value: '30 días' },
];

export function ProveedorMetricsPanel({
  title = 'Métricas Operacionales',
  metrics = defaultMetrics,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorMetricsPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className={styles.title}>{title}</h3>
      <dl className={styles.list}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.item}>
            <dt className={styles.label}>{metric.label}</dt>
            <dd className={styles.value}>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default ProveedorMetricsPanel;
