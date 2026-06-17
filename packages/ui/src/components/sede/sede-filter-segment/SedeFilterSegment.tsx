import React, { type JSX } from 'react';

import type { SedeSize, SedeStatusFilter, SedeTheme } from '../shared/sede-types';
import styles from './SedeFilterSegment.module.scss';

export interface SedeFilterSegmentOption {
  id: SedeStatusFilter;
  label: string;
}

const defaultOptions: SedeFilterSegmentOption[] = [
  { id: 'all', label: 'TODOS' },
  { id: 'active', label: 'ACTIVOS' },
  { id: 'inactive', label: 'INACTIVOS' },
];

export interface SedeFilterSegmentProps {
  options?: SedeFilterSegmentOption[];
  activeId?: SedeStatusFilter;
  onChange?: (id: SedeStatusFilter) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
  'aria-label'?: string;
}

export function SedeFilterSegment({
  options = defaultOptions,
  activeId = 'all',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Filtrar por estado',
}: SedeFilterSegmentProps): JSX.Element {
  return (
    <div
      className={[styles.segment, styles[`theme--${theme}`], styles[`size--${size}`], className]
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

export default SedeFilterSegment;
