import React, { type JSX, useMemo } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaSchedulePreview.module.scss';

const HOURS_IN_DAY = 24;

function parseHour(time: string): number {
  const [hourPart] = time.split(':');
  const hour = Number.parseInt(hourPart ?? '0', 10);
  return Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 0;
}

export interface EmpresaSchedulePreviewProps {
  openTime: string;
  closeTime: string;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaSchedulePreview({
  openTime,
  closeTime,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaSchedulePreviewProps): JSX.Element {
  const openHour = parseHour(openTime);
  const closeHour = parseHour(closeTime);

  const activeHours = useMemo(() => {
    const hours = new Set<number>();

    if (closeHour > openHour) {
      for (let hour = openHour; hour < closeHour; hour += 1) {
        hours.add(hour);
      }
      return hours;
    }

    for (let hour = openHour; hour < HOURS_IN_DAY; hour += 1) {
      hours.add(hour);
    }

    for (let hour = 0; hour < closeHour; hour += 1) {
      hours.add(hour);
    }

    return hours;
  }, [closeHour, openHour]);

  return (
    <div
      className={[styles.preview, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Horario ${openTime} a ${closeTime}`}
    >
      <div className={styles.bars}>
        {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
          <span
            key={hour}
            className={[styles.bar, activeHours.has(hour) ? styles['bar--active'] : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          />
        ))}
      </div>
      <div className={styles.labels}>
        <span>00:00</span>
        <span className={styles.centerLabel}>
          {openTime} – {closeTime}
        </span>
        <span>23:59</span>
      </div>
    </div>
  );
}

export default EmpresaSchedulePreview;
