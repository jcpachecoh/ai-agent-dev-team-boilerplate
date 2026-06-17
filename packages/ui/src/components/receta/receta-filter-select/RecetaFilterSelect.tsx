import React, { type JSX } from 'react';

import {
  InventarioSelect,
  type InventarioSelectOption,
} from '../../inventario/inventario-select/InventarioSelect';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';

export interface RecetaFilterOption {
  value: string;
  label: string;
}

export interface RecetaFilterSelectProps {
  options: RecetaFilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  /** Kept for form labels; forwarded to `aria-label` when no explicit label is set. */
  id?: string;
}

export function RecetaFilterSelect({
  options,
  value,
  onChange,
  theme = 'dark',
  size = 'xl',
  className,
  disabled,
  placeholder,
  'aria-label': ariaLabel,
  id,
}: RecetaFilterSelectProps): JSX.Element {
  const inventarioOptions: InventarioSelectOption[] = options;

  return (
    <InventarioSelect
      options={inventarioOptions}
      value={value}
      onChange={onChange}
      theme={theme}
      size={size}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel ?? id}
    />
  );
}

export default RecetaFilterSelect;
