import type { CSSProperties, JSX, ReactNode } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './FieldStatusCard.module.scss';

export interface FieldStatusCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  statusTag?: string;
  progress?: number;
  progressLabel?: string;
  accent?: 'default' | 'gold' | 'warning';
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function FieldStatusCard({
  title,
  value,
  subtitle,
  statusTag,
  progress,
  progressLabel,
  accent = 'gold',
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: FieldStatusCardProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const accentClass = styles[`accent--${accent}`];
  const progressWidth =
    progress !== undefined ? `${Math.min(100, Math.max(0, progress))}%` : undefined;

  if (loading) {
    return (
      <div
        className={[styles.card, sizeClass, themeClass, className].filter(Boolean).join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    );
  }

  return (
    <article
      className={[styles.card, sizeClass, themeClass, accentClass, className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <span className={styles.title}>{title}</span>
        {statusTag && <span className={styles.tag}>{statusTag}</span>}
      </header>

      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {progress !== undefined && (
        <div className={styles.progressSection}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressFill}
              style={{ '--progress-fill': progressWidth } as CSSProperties}
            />
          </div>
          {progressLabel && <span className={styles.progressLabel}>{progressLabel}</span>}
        </div>
      )}
    </article>
  );
}

export default FieldStatusCard;
