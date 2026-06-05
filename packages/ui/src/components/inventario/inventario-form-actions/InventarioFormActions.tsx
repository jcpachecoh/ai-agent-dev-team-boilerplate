import { Save } from 'lucide-react';
import React, { type JSX } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioFormActions.module.scss';

export type InventarioFormActionsSaveAccent = 'teal' | 'orange';

export interface InventarioFormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  saveAccent?: InventarioFormActionsSaveAccent;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioFormActions({
  onCancel,
  onSave,
  cancelLabel = 'Cancelar',
  saveLabel = 'Guardar',
  saveDisabled = false,
  saveLoading = false,
  saveAccent = 'teal',
  theme = 'light',
  size = 'md',
  className,
}: InventarioFormActionsProps): JSX.Element {
  return (
    <div
      className={[
        styles.actions,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`saveAccent--${saveAccent}`],
        className,
      ]
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

export default InventarioFormActions;
