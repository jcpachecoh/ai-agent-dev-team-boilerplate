import type { JSX } from 'react';

import type { PermisoTheme } from '../shared/permiso-types';
import styles from './PermisoCheckboxItem.module.scss';

export interface PermisoCheckboxItemProps {
  code: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  theme?: PermisoTheme;
  className?: string;
}

export function PermisoCheckboxItem({
  code,
  name,
  checked,
  disabled = false,
  onChange,
  theme = 'dark',
  className,
}: PermisoCheckboxItemProps): JSX.Element {
  return (
    <label
      className={[
        styles.item,
        styles[`theme--${theme}`],
        disabled ? styles.disabled : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className={styles.code}>{code}</span>
      <span className={styles.name}>{name}</span>
    </label>
  );
}

export default PermisoCheckboxItem;
