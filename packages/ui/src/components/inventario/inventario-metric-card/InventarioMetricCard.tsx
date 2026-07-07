import React, { type CSSProperties, type JSX, type ReactNode } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type {
  InventarioAccentColor,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioMetricCard.module.scss';

export interface InventarioMetricCardProps {
  label?: string;
  value?: string | number;
  icon?: ReactNode;
  accent?: InventarioAccentColor | string;
  loading?: boolean;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

function isSemanticAccent(value: string): value is InventarioAccentColor {
  return ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'].includes(value);
}

export function InventarioMetricCard({
  label = 'TOTAL ITEMS',
  value = 0,
  icon,
  accent = 'success',
  loading = false,
  theme = 'dark',
  size = 'md',
  className,
}: InventarioMetricCardProps): JSX.Element {
  const accentClass = isSemanticAccent(accent) ? styles[`accent--${accent}`] : undefined;
  const customStyle =
    !isSemanticAccent(accent) && accent
      ? ({ '--inventario-accent': accent } as CSSProperties)
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
        accentClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={customStyle}
    >
      <div className={styles.header}>
        <p className={styles.label}>{label}</p>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <p className={styles.value}>{value}</p>
    </article>
  );
}

export default InventarioMetricCard;
