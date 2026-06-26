import { Search } from 'lucide-react';
import type { InputHTMLAttributes, JSX } from 'react';

import styles from './CargoSearch.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoSearchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  theme?: CargoTheme;
  size?: CargoSize;
}

export function CargoSearch({
  value = '',
  onValueChange,
  placeholder = 'Buscar por nombre o área…',
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: CargoSearchProps): JSX.Element {
  return (
    <label
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
        onChange={(event) => onValueChange?.(event.target.value)}
        {...props}
      />
    </label>
  );
}

export default CargoSearch;
