import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import * as React from 'react';

import styles from './KPICard.module.scss';
import { Skeleton } from '../../feedback/skeleton';

export interface KPICardProps {
  label: string;
  value: React.ReactNode;
  delta?: number | string;
  deltaLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  variant?: 'default' | 'compact';
  loading?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  trend = 'neutral',
  color = 'default',
  variant = 'default',
  loading = false,
  theme = 'dark',
  size = 'md',
  className,
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  if (loading) {
    return (
      <div
        className={[styles.card, styles[variant], sizeClass, themeClass, className]
          .filter(Boolean)
          .join(' ')}
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    );
  }

  const TrendIcon = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    neutral: Minus,
  }[trend];

  return (
    <div
      className={[styles.card, styles[variant], styles[color], sizeClass, themeClass, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        {delta !== undefined && (
          <div className={[styles.delta, styles[trend]].join(' ')}>
            <TrendIcon size={16} />
            <span className={styles.deltaValue}>{delta}</span>
            {deltaLabel && <span className={styles.deltaLabel}>{deltaLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
