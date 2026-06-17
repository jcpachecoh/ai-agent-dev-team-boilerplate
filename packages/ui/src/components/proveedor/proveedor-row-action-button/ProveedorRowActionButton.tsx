import { Download, Eye, FileText } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorRowActionButton.module.scss';

export type ProveedorRowActionVariant = 'view' | 'report' | 'pdf';

export interface ProveedorRowActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: ProveedorRowActionVariant;
  label?: string;
  icon?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
}

const defaultLabels: Record<ProveedorRowActionVariant, string> = {
  view: 'VER',
  report: 'REPORTE',
  pdf: 'PDF',
};

const defaultIcons: Record<ProveedorRowActionVariant, ReactNode> = {
  view: <Eye aria-hidden />,
  report: <Download aria-hidden />,
  pdf: <FileText aria-hidden />,
};

export function ProveedorRowActionButton({
  variant = 'view',
  label,
  icon,
  theme = 'light',
  size = 'sm',
  className,
  disabled,
  ...props
}: ProveedorRowActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <span className={styles.icon}>{icon ?? defaultIcons[variant]}</span>
      <span>{label ?? defaultLabels[variant]}</span>
    </button>
  );
}

export default ProveedorRowActionButton;
