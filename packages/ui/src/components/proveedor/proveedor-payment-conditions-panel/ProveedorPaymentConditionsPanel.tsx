import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorPaymentConditionsPanel.module.scss';

export interface ProveedorPaymentConditionField {
  id?: string;
  label: string;
  value: string;
}

export interface ProveedorPaymentConditionsPanelProps {
  title?: string;
  fields?: ProveedorPaymentConditionField[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const defaultFields: ProveedorPaymentConditionField[] = [
  { label: 'PLAZO', value: '30 días' },
  { label: 'MÉTODO', value: 'Transferencia Bancaria' },
  { label: 'CUENTA', value: '****-****-8765' },
];

export function ProveedorPaymentConditionsPanel({
  title = 'CONDICIONES DE PAGO',
  fields = defaultFields,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorPaymentConditionsPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {fields.map((field, index) => (
          <div key={field.id ?? `${field.label}-${index}`} className={styles.field}>
            <span className={styles.label}>{field.label}</span>
            <span className={styles.value}>{field.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProveedorPaymentConditionsPanel;
