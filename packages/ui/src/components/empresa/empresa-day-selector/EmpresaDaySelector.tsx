import React, { type JSX } from 'react';

import {
  EMPRESA_WEEKDAY_LABELS,
  EMPRESA_WEEKDAYS,
  type EmpresaSize,
  type EmpresaTheme,
  type EmpresaWeekday,
} from '../shared/empresa-types';
import styles from './EmpresaDaySelector.module.scss';

export interface EmpresaDaySelectorProps {
  value: EmpresaWeekday[];
  onChange?: (days: EmpresaWeekday[]) => void;
  disabled?: boolean;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaDaySelector({
  value,
  onChange,
  disabled = false,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaDaySelectorProps): JSX.Element {
  const selected = new Set(value);

  const toggleDay = (day: EmpresaWeekday): void => {
    if (disabled || !onChange) {
      return;
    }

    if (selected.has(day)) {
      onChange(value.filter((item) => item !== day));
      return;
    }

    onChange([...value, day]);
  };

  return (
    <div
      className={[styles.selector, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Días de operación"
    >
      {EMPRESA_WEEKDAYS.map((day) => {
        const isSelected = selected.has(day);

        return (
          <button
            key={day}
            type="button"
            className={[styles.day, isSelected ? styles['day--selected'] : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => toggleDay(day)}
            disabled={disabled}
            aria-pressed={isSelected}
          >
            {EMPRESA_WEEKDAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}

export default EmpresaDaySelector;
