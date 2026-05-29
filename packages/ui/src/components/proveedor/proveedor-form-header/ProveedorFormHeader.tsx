import { ChevronLeft } from 'lucide-react';
import React, { type JSX } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorFormHeader.module.scss';

export interface ProveedorFormHeaderProps {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorFormHeader({
  title = 'NUEVO PROVEEDOR',
  onBack,
  backLabel = 'Volver',
  theme = 'light',
  size = 'md',
  className,
}: ProveedorFormHeaderProps): JSX.Element {
  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
        <ChevronLeft aria-hidden />
      </button>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}

export default ProveedorFormHeader;
