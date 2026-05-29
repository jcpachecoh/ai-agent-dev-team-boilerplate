import { Save } from 'lucide-react';
import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorFormActions.module.scss';

export interface ProveedorFormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorFormActions({
  onCancel,
  onSave,
  cancelLabel = 'Cancelar',
  saveLabel = 'Guardar',
  saveDisabled = false,
  saveLoading = false,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorFormActionsProps): JSX.Element {
  return (
    <div
      className={[styles.actions, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className={styles.cancel} onClick={onCancel} disabled={saveLoading}>
        {cancelLabel}
      </button>
      <button
        type="button"
        className={styles.save}
        onClick={onSave}
        disabled={saveDisabled || saveLoading}
        aria-busy={saveLoading || undefined}
      >
        <Save className={styles.saveIcon} aria-hidden />
        {saveLabel}
      </button>
    </div>
  );
}

export default ProveedorFormActions;
