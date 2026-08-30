import React, { type JSX } from 'react';

import {
  InventarioSelect,
  type InventarioSelectOption,
} from '../../inventario/inventario-select/InventarioSelect';
import type { SedeAssignUserOption, SedeSize, SedeTheme } from '../shared/sede-types';

export interface SedeUserSelectProps {
  options: SedeAssignUserOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
  'aria-label'?: string;
}

function toSelectOptions(options: SedeAssignUserOption[]): InventarioSelectOption[] {
  return options.map((option) => ({
    value: option.id,
    label: option.hint ? `${option.label} · ${option.hint}` : option.label,
  }));
}

export function SedeUserSelect({
  options,
  value = '',
  onChange,
  placeholder = 'Seleccionar usuario…',
  disabled = false,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SedeUserSelectProps): JSX.Element {
  return (
    <InventarioSelect
      options={toSelectOptions(options)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      theme={theme}
      size={size === 'sm' ? 'md' : 'xl'}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

export default SedeUserSelect;
