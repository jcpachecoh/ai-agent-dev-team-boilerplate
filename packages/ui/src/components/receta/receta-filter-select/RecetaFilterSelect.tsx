import { ChevronDown } from 'lucide-react';
import React, { type JSX, type SelectHTMLAttributes } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaFilterSelect.module.scss';

export interface RecetaFilterOption {
  value: string;
  label: string;
}

export interface RecetaFilterSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'onChange'
> {
  options: RecetaFilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

export function RecetaFilterSelect({
  options,
  value,
  onChange,
  theme = 'dark',
  size = 'xl',
  className,
  ...props
}: RecetaFilterSelectProps): JSX.Element {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    onChange?.(event.target.value);
  };

  return (
    <div
      className={[styles.selectWrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
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

export default RecetaFilterSelect;
