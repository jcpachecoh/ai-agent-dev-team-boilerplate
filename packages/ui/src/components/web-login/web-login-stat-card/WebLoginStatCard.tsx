import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps, WebLoginTrendTone } from '../shared/web-login-types';
import styles from './WebLoginStatCard.module.scss';

export interface WebLoginStatCardProps extends WebLoginSurfaceProps {
  label: string;
  value: string;
  trendLabel?: string;
  trendTone?: WebLoginTrendTone;
}

export function WebLoginStatCard({
  label,
  value,
  trendLabel,
  trendTone = 'neutral',
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginStatCardProps): JSX.Element {
  return (
    <article
      className={webLoginSurfaceClass(styles.card, styles, { theme, size, className })}
      aria-label={`${label}: ${value}`}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {trendLabel ? (
        <p className={[styles.trend, styles[`trend--${trendTone}`]].join(' ')}>{trendLabel}</p>
      ) : null}
    </article>
  );
}
