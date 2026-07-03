import React, { type JSX, type ReactNode } from 'react';

import { InventarioPrimaryButton } from '../inventario-primary-button/InventarioPrimaryButton';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioPageToolbar.module.scss';

export interface InventarioPageToolbarProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioPageToolbar({
  title = 'Gestión de Productos',
  subtitle = 'Administrar catálogo de productos e inventario',
  action,
  showAction = true,
  actionLabel = 'CREAR PRODUCTO',
  onAction,
  theme = 'light',
  size = 'md',
  className,
}: InventarioPageToolbarProps): JSX.Element {
  return (
    <header
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {showAction &&
        (action ?? (
          <InventarioPrimaryButton
            label={actionLabel}
            theme={theme}
            size={size}
            onClick={onAction}
          />
        ))}
    </header>
  );
}

export default InventarioPageToolbar;
