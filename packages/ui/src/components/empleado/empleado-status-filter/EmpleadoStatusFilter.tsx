import type { JSX } from 'react';

import type {
  EmpleadoSize,
  EmpleadoStatusFilterValue,
  EmpleadoTheme,
} from '../shared/empleado-types';
import styles from './EmpleadoStatusFilter.module.scss';

export interface EmpleadoStatusFilterOption {
  id: EmpleadoStatusFilterValue;
  label: string;
}

const defaultOptions: EmpleadoStatusFilterOption[] = [
  { id: 'all', label: 'TODOS' },
  { id: 'active', label: 'ACTIVO' },
  { id: 'inactive', label: 'INACTIVO' },
];

export interface EmpleadoStatusFilterProps {
  options?: EmpleadoStatusFilterOption[];
  activeId?: EmpleadoStatusFilterValue;
  onChange?: (id: EmpleadoStatusFilterValue) => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
  'aria-label'?: string;
}

export function EmpleadoStatusFilter({
  options = defaultOptions,
  activeId = 'all',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Filtrar por estado',
}: EmpleadoStatusFilterProps): JSX.Element {
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

export default EmpleadoStatusFilter;
