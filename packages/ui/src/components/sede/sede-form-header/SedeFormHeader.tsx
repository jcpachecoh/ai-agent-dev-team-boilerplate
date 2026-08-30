import { ArrowLeft, Building2 } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeFormHeader.module.scss';

export interface SedeFormHeaderProps {
  title?: string;
  locationId?: string;
  onBack?: () => void;
  backLabel?: string;
  icon?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeFormHeader({
  title = 'Nueva sede',
  locationId,
  onBack,
  backLabel = 'Volver al listado',
  icon,
  theme = 'dark',
  size = 'md',
  className,
}: SedeFormHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack}>
          <ArrowLeft aria-hidden />
          <span>{backLabel}</span>
        </button>
      )}
      {onBack && (
        <span className={styles.divider} aria-hidden>
          |
        </span>
      )}
      <div className={styles.titleRow}>
        <div className={styles.titleWrap}>
          <span className={styles.icon} aria-hidden>
            {icon ?? <Building2 />}
          </span>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {locationId && <span className={styles.idBadge}>ID: {locationId}</span>}
      </div>
    </header>
  );
}

export default SedeFormHeader;
