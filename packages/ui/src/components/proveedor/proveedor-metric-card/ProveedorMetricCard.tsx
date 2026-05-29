import React, { type CSSProperties, type JSX } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type {
  ProveedorMetricValueColor,
  ProveedorSize,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorMetricCard.module.scss';

export interface ProveedorMetricCardProps {
  label?: string;
  value?: string | number;
  valueFormat?: 'plain' | 'currency' | 'compact';
  valueColor?: ProveedorMetricValueColor | string;
  loading?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

function isSemanticColor(value: string): value is ProveedorMetricValueColor {
  return ['default', 'success', 'warning', 'danger', 'info', 'enterprise'].includes(value);
}

export function ProveedorMetricCard({
  label = 'PROVEEDORES ACTIVOS',
  value = 0,
  valueFormat = 'plain',
  valueColor = 'default',
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorMetricCardProps): JSX.Element {
  const colorClass = isSemanticColor(valueColor) ? styles[`color--${valueColor}`] : undefined;
  const customStyle =
    !isSemanticColor(valueColor) && valueColor
      ? ({ '--metric-value-color': valueColor } as CSSProperties)
      : undefined;

  if (loading) {
    return (
      <article
        className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </article>
    );
  }

  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`format--${valueFormat}`],
        colorClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={customStyle}
    >
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </article>
  );
}

export default ProveedorMetricCard;
