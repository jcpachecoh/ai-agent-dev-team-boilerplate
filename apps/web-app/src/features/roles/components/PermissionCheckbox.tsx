import type { JSX } from 'react';

import type { PermissionCatalogItem } from '../types';
import styles from './RolePermissionsPanel.module.scss';

interface PermissionCheckboxProps {
  permission: PermissionCatalogItem;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

export function PermissionCheckbox({
  permission,
  checked,
  disabled = false,
  onChange,
}: PermissionCheckboxProps): JSX.Element {
  return (
    <label className={`${styles.permissionItem} ${disabled ? styles.permissionItemDisabled : ''}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className={styles.permissionCode}>{permission.code}</span>
      <span className={styles.permissionName}>{permission.name}</span>
    </label>
  );
}
