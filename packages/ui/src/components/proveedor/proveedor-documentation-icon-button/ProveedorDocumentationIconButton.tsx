import { Download, Pencil, Trash2, Upload } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorDocumentationIconButton.module.scss';

export type ProveedorDocumentationIconButtonVariant = 'download' | 'replace' | 'delete' | 'upload';

export interface ProveedorDocumentationIconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: ProveedorDocumentationIconButtonVariant;
  tooltip?: string;
  theme?: ProveedorTheme;
}

const ICONS: Record<ProveedorDocumentationIconButtonVariant, ReactNode> = {
  download: <Download aria-hidden />,
  replace: <Pencil aria-hidden />,
  delete: <Trash2 aria-hidden />,
  upload: <Upload aria-hidden />,
};

const DEFAULT_TOOLTIPS: Record<ProveedorDocumentationIconButtonVariant, string> = {
  download: 'Descargar',
  replace: 'Reemplazar',
  delete: 'Eliminar',
  upload: 'Subir documento',
};

export function ProveedorDocumentationIconButton({
  variant = 'download',
  tooltip,
  theme = 'light',
  className,
  disabled,
  ...props
}: ProveedorDocumentationIconButtonProps): JSX.Element {
  const resolvedTooltip = tooltip ?? DEFAULT_TOOLTIPS[variant];

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`variant--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-label={resolvedTooltip}
      title={resolvedTooltip}
      data-tooltip={resolvedTooltip}
      {...props}
    >
      {ICONS[variant]}
    </button>
  );
}

export default ProveedorDocumentationIconButton;
