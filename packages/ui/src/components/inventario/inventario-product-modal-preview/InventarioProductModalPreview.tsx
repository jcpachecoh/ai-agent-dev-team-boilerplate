import React, { type JSX } from 'react';

import { InventarioFormField } from '../inventario-form-field';
import { InventarioModal } from '../inventario-modal';
import { InventarioProductsPreview } from '../inventario-products-preview';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioProductModalPreview.module.scss';

export interface InventarioProductModalPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const modalFields = [
  'SKU',
  'Nombre',
  'Categoría',
  'Proveedor',
  'Precio Costo',
  'Precio Venta',
  'Stock Mínimo',
  'Stock Máximo',
];

export function InventarioProductModalPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioProductModalPreviewProps): JSX.Element {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <InventarioProductsPreview theme={theme} size={size} className={styles.backdrop} />
      <InventarioModal
        open
        theme={theme}
        size={size}
        className={styles.modal}
        onClose={() => undefined}
      >
        {modalFields.map((label) => (
          <InventarioFormField
            key={label}
            label={label}
            inputType="input"
            theme={theme}
            size={size}
          />
        ))}
      </InventarioModal>
    </div>
  );
}

export default InventarioProductModalPreview;
