import { Save } from 'lucide-react';
import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorFormActions.module.scss';

export interface ProveedorFormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveDraftLabel?: string;
  saveDisabled?: boolean;
  saveDraftDisabled?: boolean;
  saveLoading?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  /** Stretch the action row to full width (buttons stay right-aligned). */
  fullWidth?: boolean;
  className?: string;
}

export function ProveedorFormActions({
  onCancel,
  onSave,
  onSaveDraft,
  cancelLabel = 'Cancelar',
  saveLabel = 'Guardar',
  saveDraftLabel = 'Guardar borrador',
  saveDisabled = false,
  saveDraftDisabled = false,
  saveLoading = false,
  theme = 'light',
  size = 'md',
  fullWidth = false,
  className,
}: ProveedorFormActionsProps): JSX.Element {
  return (
    <div
      className={[
        styles.actions,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        fullWidth && styles.actionsFullWidth,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className={styles.cancel} onClick={onCancel} disabled={saveLoading}>
        {cancelLabel}
      </button>
      {onSaveDraft && (
        <button
          type="button"
          className={styles.draft}
          onClick={onSaveDraft}
          disabled={saveDraftDisabled || saveLoading}
        >
          {saveDraftLabel}
        </button>
      )}
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
