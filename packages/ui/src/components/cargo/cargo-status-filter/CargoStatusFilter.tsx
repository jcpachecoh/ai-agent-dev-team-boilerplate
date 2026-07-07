import type { JSX } from 'react';

import styles from './CargoStatusFilter.module.scss';
import type { CargoSize, CargoStatusFilterValue, CargoTheme } from '../shared/cargo-types';

export interface CargoStatusFilterOption {
  id: CargoStatusFilterValue;
  label: string;
}

const defaultOptions: CargoStatusFilterOption[] = [
  { id: 'all', label: 'TODOS' },
  { id: 'active', label: 'ACTIVO' },
  { id: 'inactive', label: 'INACTIVO' },
];

export interface CargoStatusFilterProps {
  options?: CargoStatusFilterOption[];
  activeId?: CargoStatusFilterValue;
  onChange?: (id: CargoStatusFilterValue) => void;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
  'aria-label'?: string;
}

export function CargoStatusFilter({
  options = defaultOptions,
  activeId = 'all',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Filtrar por estado',
}: CargoStatusFilterProps): JSX.Element {
  return (
    <div
      className={[styles.filter, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            className={[styles.button, isActive && styles.active, index > 0 && styles.withDivider]
              .filter(Boolean)
              .join(' ')}
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

export default CargoStatusFilter;
