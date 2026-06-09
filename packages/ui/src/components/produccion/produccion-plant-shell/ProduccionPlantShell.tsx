import { AlertTriangle, Clock, Factory, Home } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import styles from './ProduccionPlantShell.module.scss';
import type { ProduccionSize, ProduccionTheme } from '../shared/produccion-types';

export interface ProduccionPlantShellProps {
  backLabel?: string;
  onBack?: () => void;
  appName?: string;
  appLabel?: string;
  contextLabel?: string;
  shiftLabel?: string;
  shiftTimeLabel?: string;
  alarmLabel?: string;
  criticalAlarmLabel?: string;
  liveLabel?: string;
  timeLabel?: string;
  dateLabel?: string;
  children?: ReactNode;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionPlantShell({
  backLabel = '← INICIO',
  onBack,
  appName = 'RestOpsIQ',
  appLabel = 'PLANT',
  contextLabel = 'Mapa de planta',
  shiftLabel = 'Turno Mañana',
  shiftTimeLabel = '06:00 – 14:00',
  alarmLabel = '4 ALARMAS',
  criticalAlarmLabel = '1 CRÍTICA',
  liveLabel = 'EN VIVO',
  timeLabel = '10:18:09 a. m.',
  dateLabel = 'mar, 09 de jun',
  children,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionPlantShellProps): JSX.Element {
  return (
    <div
      className={[styles.shell, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <div className={styles.left}>
          <button type="button" className={styles.back} onClick={onBack}>
            {backLabel}
          </button>
          <span className={styles.divider} />
          <div className={styles.brand}>
            <Factory aria-hidden />
            <strong>{appName}</strong>
            <span>{appLabel}</span>
          </div>
          <span className={styles.divider} />
          <div className={styles.context}>
            <Home aria-hidden />
            <strong>{contextLabel}</strong>
            <span>—</span>
            <span>{shiftLabel}</span>
            <em>{shiftTimeLabel}</em>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.alarm}>
            <AlertTriangle aria-hidden />
            <strong>{alarmLabel}</strong>
            <span>{criticalAlarmLabel}</span>
          </div>
          <span className={styles.liveDot} />
          <span className={styles.live}>{liveLabel}</span>
          <span className={styles.divider} />
          <strong className={styles.time}>{timeLabel}</strong>
          <span className={styles.date}>{dateLabel}</span>
          <Clock className={styles.clock} aria-hidden />
        </div>
      </header>
      {children}
    </div>
  );
}

export default ProduccionPlantShell;
