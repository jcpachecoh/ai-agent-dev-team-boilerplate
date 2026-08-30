import { Search } from 'lucide-react';
import type { InputHTMLAttributes, JSX } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioSearch.module.scss';

export interface UsuarioSearchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
}

export function UsuarioSearch({
  value = '',
  onValueChange,
  placeholder = 'Buscar por email, cédula o rol…',
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: UsuarioSearchProps): JSX.Element {
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

export default UsuarioSearch;
