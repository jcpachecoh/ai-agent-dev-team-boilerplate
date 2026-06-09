import { BookOpen, Clock3, Factory, Utensils } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaMetricCard.module.scss';

export type RecetaMetricCardVariant = 'type-1' | 'type-2' | 'type-3' | 'type-4';

export interface RecetaMetricCardProps {
  variant?: RecetaMetricCardVariant;
  title?: string;
  value?: string | number;
  description?: string;
  icon?: ReactNode;
  loading?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

const variantIcons: Record<RecetaMetricCardVariant, JSX.Element> = {
  'type-1': <BookOpen aria-hidden />,
  'type-2': <Clock3 aria-hidden />,
  'type-3': <Utensils aria-hidden />,
  'type-4': <Factory aria-hidden />,
};

export function RecetaMetricCard({
  variant = 'type-1',
  title = 'Total recetas',
  value = 7,
  description,
  icon,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: RecetaMetricCardProps): JSX.Element {
  const themeClass = styles[`theme--${theme}`];
  const sizeClass = styles[`size--${size}`];
  const variantClass = styles[`variant--${variant}`];

  if (loading) {
    return (
      <article
        className={[styles.card, themeClass, sizeClass, className].filter(Boolean).join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </article>
    );
  }

  const visualIcon = icon ?? variantIcons[variant];

  return (
    <article
      className={[styles.card, themeClass, sizeClass, variantClass, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.header}>
        <p className={styles.title}>{title}</p>
        {visualIcon && <span className={styles.icon}>{visualIcon}</span>}
      </div>
      <p className={styles.value}>{value}</p>
      {description && <p className={styles.description}>{description}</p>}
    </article>
  );
}

export default RecetaMetricCard;
