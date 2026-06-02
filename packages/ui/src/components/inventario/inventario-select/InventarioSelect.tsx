import { ChevronDown } from 'lucide-react';
import React, { type JSX, type SelectHTMLAttributes } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioSelect.module.scss';

export interface InventarioSelectOption {
  value: string;
  label: string;
}

export interface InventarioSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'onChange'
> {
  options: InventarioSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioSelect({
  options,
  value,
  onChange,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: InventarioSelectProps): JSX.Element {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    onChange?.(event.target.value);
  };

  return (
    <div
      className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <select className={styles.select} value={value} onChange={handleChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className={styles.chevron} aria-hidden />
    </div>
  );
}

export default InventarioSelect;
