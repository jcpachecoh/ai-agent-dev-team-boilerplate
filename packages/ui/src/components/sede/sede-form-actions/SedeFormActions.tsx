import React, { type JSX } from 'react';

import { SedeActionButton } from '../sede-action-button';
import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeFormActions.module.scss';

export type SedeFormActionsMode = 'create' | 'edit';

export interface SedeFormActionsProps {
  mode?: SedeFormActionsMode;
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeFormActions({
  mode = 'create',
  onCancel,
  onSubmit,
  cancelLabel = 'Cancelar',
  submitLabel,
  submitLoading = false,
  submitDisabled = false,
  theme = 'dark',
  size = 'md',
  className,
}: SedeFormActionsProps): JSX.Element {
  const resolvedSubmitLabel = submitLabel ?? (mode === 'create' ? 'Crear sede' : 'Guardar cambios');

  return (
    <div
      className={[styles.actions, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <SedeActionButton
        variant="secondary"
        label={cancelLabel}
        theme={theme}
        size={size}
        onClick={onCancel}
      />
      <SedeActionButton
        variant={mode === 'create' ? 'create' : 'save'}
        label={resolvedSubmitLabel}
        theme={theme}
        size={size}
        onClick={onSubmit}
        loading={submitLoading}
        disabled={submitDisabled}
      />
    </div>
  );
}

export default SedeFormActions;
