import { X } from 'lucide-react';
import React, { type JSX, type ReactNode, useEffect } from 'react';

import { ProveedorFormActions } from '../proveedor-form-actions/ProveedorFormActions';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorProductModal.module.scss';

export interface ProveedorProductModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  children?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorProductModal({
  open = true,
  title = 'Editar Producto',
  subtitle = 'Configurar información del producto',
  onClose,
  onCancel,
  onSave,
  saveLoading = false,
  saveDisabled = false,
  children,
  theme = 'dark',
  size = 'md',
  className,
}: ProveedorProductModalProps): JSX.Element | null {
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
        aria-labelledby="proveedor-product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="proveedor-product-modal-title" className={styles.title}>
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
          <ProveedorFormActions
            fullWidth
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

export default ProveedorProductModal;
