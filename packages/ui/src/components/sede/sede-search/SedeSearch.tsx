import { Search } from 'lucide-react';
import React, { type InputHTMLAttributes, type JSX } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeSearch.module.scss';

export interface SedeSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value?: string;
  onValueChange?: (value: string) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeSearch({
  value = '',
  onValueChange,
  placeholder = 'Buscar por nombre, ciudad o dirección...',
  theme = 'dark',
  size = 'md',
  className,
  onChange,
  ...props
}: SedeSearchProps): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  return (
    <div
      className={[styles.search, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <Search className={styles.icon} aria-hidden />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}

export default SedeSearch;
