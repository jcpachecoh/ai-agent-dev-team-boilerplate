import { Scale } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './TripProgressStrip.module.scss';

export interface TripProgressStripProps {
  /** Uppercase label, e.g. "Cantidad a producir" */
  label?: string;
  /** Main metric, e.g. "50 kg" */
  value: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function TripProgressStrip({
  label = 'Cantidad a producir',
  value,
  icon,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: TripProgressStripProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const iconSize = size === 'sm' ? 20 : size === 'xl' ? 32 : 26;

  if (loading) {
    return (
      <article
        className={[styles.card, sizeClass, themeClass, className].filter(Boolean).join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </article>
    );
  }

  return (
    <article className={[styles.card, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <span className={styles.label}>{label}</span>
      </header>
      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        <span className={styles.icon} aria-hidden>
          {icon ?? <Scale size={iconSize} strokeWidth={1.5} />}
        </span>
      </div>
    </article>
  );
}

export default TripProgressStrip;
