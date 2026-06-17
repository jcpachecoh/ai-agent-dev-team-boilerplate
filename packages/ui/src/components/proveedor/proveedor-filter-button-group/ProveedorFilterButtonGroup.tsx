import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorFilterButtonGroup.module.scss';

export interface ProveedorFilterOption {
  id: string;
  label: string;
}

export interface ProveedorFilterButtonGroupProps {
  options: ProveedorFilterOption[];
  activeId: string;
  onChange?: (id: string) => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
  'aria-label'?: string;
}

export function ProveedorFilterButtonGroup({
  options,
  activeId,
  onChange,
  theme = 'light',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Filtrar',
}: ProveedorFilterButtonGroupProps): JSX.Element {
  return (
    <div
      className={[styles.group, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            className={[styles.button, isActive && styles.active].filter(Boolean).join(' ')}
            aria-pressed={isActive}
            onClick={() => onChange?.(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ProveedorFilterButtonGroup;
