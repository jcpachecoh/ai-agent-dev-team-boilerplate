import React, { type JSX } from 'react';

import styles from './ProduccionFilterChipGroup.module.scss';
import type {
  ProduccionFilterChip,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionFilterChipGroupProps {
  chips?: ProduccionFilterChip[];
  activeId?: string;
  onChange?: (chipId: string) => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

const defaultChips = [
  { id: 'all', label: 'TODAS' },
  { id: 'active', label: 'ACTIVA' },
  { id: 'inactive', label: 'INACTIVA' },
  { id: 'maintenance', label: 'MANTENIMIENTO' },
];

export function ProduccionFilterChipGroup({
  chips = defaultChips,
  activeId = 'all',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionFilterChipGroupProps): JSX.Element {
  return (
    <div
      className={[styles.group, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="group"
    >
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            type="button"
            className={[styles.chip, active && styles.active].filter(Boolean).join(' ')}
            aria-pressed={active}
            onClick={() => onChange?.(chip.id)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export default ProduccionFilterChipGroup;
