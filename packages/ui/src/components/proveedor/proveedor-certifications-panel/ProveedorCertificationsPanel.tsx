import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorCertificationsPanel.module.scss';

export interface ProveedorCertificationItem {
  id?: string;
  label: string;
}

export interface ProveedorCertificationsPanelProps {
  title?: string;
  items?: ProveedorCertificationItem[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const defaultItems: ProveedorCertificationItem[] = [
  { label: 'ISO 9001:2015' },
  { label: 'HACCP' },
  { label: 'BPM Alimentos' },
];

export function ProveedorCertificationsPanel({
  title = 'CERTIFICACIONES VIGENTES',
  items = defaultItems,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorCertificationsPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item.id ?? `${item.label}-${index}`} className={styles.item}>
            <span className={styles.dot} aria-hidden />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProveedorCertificationsPanel;
