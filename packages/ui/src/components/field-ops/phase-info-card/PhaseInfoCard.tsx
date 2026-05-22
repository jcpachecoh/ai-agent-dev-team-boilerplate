import * as React from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PhaseInfoCard.module.scss';

export interface PhaseInfoCardProps {
  opId: string;
  phaseLabel: string;
  productName: string;
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export const PhaseInfoCard: React.FC<PhaseInfoCardProps> = ({
  opId,
  phaseLabel,
  productName,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

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
      <p className={styles.opId}>{opId}</p>
      <p className={styles.phaseLabel}>{phaseLabel}</p>
      <p className={styles.productName}>{productName}</p>
    </article>
  );
};

export default PhaseInfoCard;
