import { Search } from 'lucide-react';
import type { InputHTMLAttributes, JSX } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoSearch.module.scss';

export interface EmpleadoSearchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
}

export function EmpleadoSearch({
  value = '',
  onValueChange,
  placeholder = 'Buscar nombre o cédula...',
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: EmpleadoSearchProps): JSX.Element {
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

export default EmpleadoSearch;
