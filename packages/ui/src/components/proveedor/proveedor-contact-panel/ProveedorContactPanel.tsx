import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorContactPanel.module.scss';

export interface ProveedorContactField {
  label: string;
  value: string;
}

export interface ProveedorContactPanelProps {
  title?: string;
  fields?: ProveedorContactField[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const defaultFields: ProveedorContactField[] = [
  { label: 'EMAIL', value: 'compras@carnesdelvalle.co' },
  { label: 'TELÉFONO', value: '+57 300 123 4567' },
  { label: 'DIRECCIÓN', value: 'Calle 45 #12-34, Zona Industrial' },
  { label: 'CIUDAD', value: 'Cali' },
];

export function ProveedorContactPanel({
  title = 'Datos de Contacto',
  fields = defaultFields,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorContactPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className={styles.title}>{title}</h3>
      <dl className={styles.list}>
        {fields.map((field) => (
          <div key={field.label} className={styles.item}>
            <dt className={styles.label}>{field.label}</dt>
            <dd className={styles.value}>{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default ProveedorContactPanel;
