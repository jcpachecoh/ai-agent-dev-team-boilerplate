import * as React from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './QuantityUnitToggle.module.scss';

export interface QuantityUnitOption {
  value: string;
  label: string;
}

export interface QuantityUnitToggleProps {
  options: QuantityUnitOption[];
  value: string;
  onChange?: (value: string) => void;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
  'aria-label'?: string;
}

export function QuantityUnitToggle({
  options,
  value,
  onChange,
  theme = 'light',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Unidad de medida',
}: QuantityUnitToggleProps): React.JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div
      className={[styles.toggle, themeClass, sizeClass, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={[styles.option, isSelected && styles.optionSelected]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isSelected}
            onClick={() => {
              if (!isSelected) onChange?.(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default QuantityUnitToggle;
