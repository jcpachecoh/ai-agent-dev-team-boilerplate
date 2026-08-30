import type { JSX } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './OperationsHubHeader.module.scss';

export interface OperationsHubHeaderProps {
  brandLetter?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  statusLabel?: string;
  isOnline?: boolean;
  time?: string;
  dateLabel?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function OperationsHubHeader({
  brandLetter = 'R',
  brandTitle = 'RestOpsIQ Plant',
  brandSubtitle = 'PALOS DE LEÑA · BOGOTÁ',
  statusLabel = 'SISTEMA EN LÍNEA',
  isOnline = true,
  time,
  dateLabel,
  theme = 'dark',
  size = 'md',
  className,
}: OperationsHubHeaderProps): JSX.Element {
  const displayTime =
    time ??
    new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const displayDate =
    dateLabel ??
    new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>
          {brandLetter}
        </span>
        <div className={styles.brandText}>
          <p className={styles.brandTitle}>{brandTitle}</p>
          <p className={styles.brandSubtitle}>{brandSubtitle}</p>
        </div>
      </div>

      <div className={styles.statusBlock}>
        <span
          className={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]
            .filter(Boolean)
            .join(' ')}
          role="status"
        >
          <span className={styles.statusDot} aria-hidden />
          {statusLabel}
        </span>
        <div className={styles.clock}>
          <time className={styles.time}>{displayTime}</time>
          <p className={styles.date}>{displayDate}</p>
        </div>
      </div>
    </header>
  );
}

export default OperationsHubHeader;
