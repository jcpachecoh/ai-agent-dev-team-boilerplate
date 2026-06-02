import { X } from 'lucide-react';
import React, { type JSX, type ReactNode, useEffect } from 'react';

import { InventarioFormActions } from '../inventario-form-actions/InventarioFormActions';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioModal.module.scss';

export interface InventarioModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  children?: ReactNode;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioModal({
  open = true,
  title = 'Editar Producto',
  subtitle = 'Configurar información del producto',
  onClose,
  onCancel,
  onSave,
  saveLoading = false,
  saveDisabled = false,
  children,
  theme = 'light',
  size = 'md',
  className,
}: InventarioModalProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <div
      className={[styles.overlay, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={[styles.modal, styles[`size--${size}`]].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventario-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="inventario-modal-title" className={styles.title}>
              {title}
            </h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X aria-hidden />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          <InventarioFormActions
            theme={theme}
            size={size}
            onCancel={handleCancel}
            onSave={onSave}
            saveLoading={saveLoading}
            saveDisabled={saveDisabled}
          />
        </footer>
      </div>
    </div>
  );
}

export default InventarioModal;
