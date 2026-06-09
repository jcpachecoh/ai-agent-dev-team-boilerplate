import React, { type CSSProperties, type JSX } from 'react';

import {
  ProveedorMetricCard,
  type ProveedorMetricCardProps,
} from '../proveedor-metric-card/ProveedorMetricCard';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorMetricsBar.module.scss';

export interface ProveedorMetricsBarProps {
  metrics: ProveedorMetricCardProps[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorMetricsBar({
  metrics,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorMetricsBarProps): JSX.Element {
  return (
    <div
      className={[styles.bar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      style={{ '--metric-count': metrics.length } as CSSProperties}
    >
      {metrics.map((metric, index) => (
        <ProveedorMetricCard key={metric.label ?? index} {...metric} theme={theme} size={size} />
      ))}
    </div>
  );
}

export default ProveedorMetricsBar;
