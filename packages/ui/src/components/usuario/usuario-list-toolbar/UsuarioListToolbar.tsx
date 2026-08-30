import type { JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import { UsuarioSearch } from '../usuario-search';
import styles from './UsuarioListToolbar.module.scss';

export interface UsuarioListToolbarProps {
  count: number;
  countLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  primaryAction?: ReactNode;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioListToolbar({
  count,
  countLabel = 'usuarios',
  searchValue,
  onSearchChange,
  searchPlaceholder,
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioListToolbarProps): JSX.Element {
  const label = count === 1 ? countLabel.replace(/s$/, '') : countLabel;

  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.count}>
        {count} {label}
      </p>
      <div className={styles.searchWrap}>
        <UsuarioSearch
          value={searchValue}
          placeholder={searchPlaceholder}
          onValueChange={onSearchChange}
          theme={theme}
          size={size}
        />
      </div>
      {primaryAction ? <div className={styles.action}>{primaryAction}</div> : null}
    </div>
  );
}

export default UsuarioListToolbar;
