import { Check, Eye, Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import React, { type JSX } from 'react';

import type { InventarioIconButtonVariant, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioIconButton.module.scss';

const ICONS: Record<InventarioIconButtonVariant, JSX.Element> = {
  edit: <Pencil aria-hidden />,
  delete: <Trash2 aria-hidden />,
  view: <Eye aria-hidden />,
  order: <ShoppingCart aria-hidden />,
  resolve: <Check aria-hidden />,
};

export interface InventarioIconButtonProps {
  variant?: InventarioIconButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  theme?: InventarioTheme;
  className?: string;
}

export function InventarioIconButton({
  variant = 'edit',
  onClick,
  disabled = false,
  ariaLabel,
  theme = 'light',
  className,
}: InventarioIconButtonProps): JSX.Element {
  const labels: Record<InventarioIconButtonVariant, string> = {
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    order: 'Ordenar',
    resolve: 'Resolver',
  };

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
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? labels[variant]}
    >
      {ICONS[variant]}
    </button>
  );
}

export default InventarioIconButton;
