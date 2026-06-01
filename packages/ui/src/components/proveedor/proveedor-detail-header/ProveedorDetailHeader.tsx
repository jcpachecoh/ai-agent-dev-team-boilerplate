import { ChevronLeft } from 'lucide-react';
import React, { type JSX } from 'react';

import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import type {
  ProveedorSize,
  ProveedorSupplierStatus,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorDetailHeader.module.scss';

export interface ProveedorDetailHeaderProps {
  name?: string;
  code?: string;
  taxId?: string;
  status?: ProveedorSupplierStatus;
  onBack?: () => void;
  backLabel?: string;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorDetailHeader({
  name = 'Carnes del Valle S.A.S',
  code = 'SUP-001',
  taxId = '900.123.456-7',
  status = 'active',
  onBack,
  backLabel = 'Volver',
  theme = 'light',
  size = 'md',
  className,
}: ProveedorDetailHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
        <ChevronLeft aria-hidden />
      </button>
      <div className={styles.info}>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.meta}>
          {code} · NIT {taxId}
        </p>
      </div>
      <ProveedorStatusBadge domain="supplier" status={status} theme={theme} size="md" />
    </header>
  );
}

export default ProveedorDetailHeader;
