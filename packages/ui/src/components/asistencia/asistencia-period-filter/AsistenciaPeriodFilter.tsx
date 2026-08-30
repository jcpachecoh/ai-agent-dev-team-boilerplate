import type { JSX } from 'react';

import type { AsistenciaMonitorPeriod, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaPeriodFilter.module.scss';

const PERIOD_OPTIONS: Array<{ id: AsistenciaMonitorPeriod; label: string }> = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
];

export interface AsistenciaPeriodFilterProps {
  period?: AsistenciaMonitorPeriod;
  anchorDate?: string;
  onPeriodChange?: (period: AsistenciaMonitorPeriod) => void;
  onAnchorDateChange?: (anchorDate: string) => void;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaPeriodFilter({
  period = 'day',
  anchorDate,
  onPeriodChange,
  onAnchorDateChange,
  theme = 'dark',
  className,
}: AsistenciaPeriodFilterProps): JSX.Element {
  const inputType = period === 'year' ? 'number' : 'date';
  const inputValue = period === 'year' ? (anchorDate?.slice(0, 4) ?? '') : (anchorDate ?? '');

  return (
    <div
      className={[styles.filter, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <div className={styles.segmented} role="group" aria-label="Periodo de asistencia">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={[styles.button, period === option.id && styles.active]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={period === option.id}
            onClick={() => onPeriodChange?.(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <input
        className={styles.dateInput}
        type={inputType}
        value={inputValue}
        min={period === 'year' ? '2000' : undefined}
        max={period === 'year' ? '2100' : undefined}
        onChange={(event) => {
          const value = event.target.value;
          if (!value) return;
          if (period === 'year') {
            onAnchorDateChange?.(`${value}-01-01`);
            return;
          }
          onAnchorDateChange?.(value);
        }}
        aria-label={period === 'year' ? 'Año' : 'Fecha de referencia'}
      />
    </div>
  );
}

export default AsistenciaPeriodFilter;
