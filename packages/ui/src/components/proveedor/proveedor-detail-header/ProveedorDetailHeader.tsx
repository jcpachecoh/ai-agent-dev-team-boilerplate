import { ChevronLeft } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import { ProveedorStatusBadge } from '../proveedor-status-badge/ProveedorStatusBadge';
import type {
  ProveedorSize,
  ProveedorSupplierStatus,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorDetailHeader.module.scss';

function toCssFontSize(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export interface ProveedorDetailHeaderProps {
  name?: string;
  code?: string;
  taxId?: string;
  status?: ProveedorSupplierStatus;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  /** Overrides size preset for the supplier name (e.g. `1.5rem`, `24px`). */
  nameFontSize?: string | number;
  /** Overrides size preset for code / NIT line (e.g. `0.75rem`, `12px`). */
  metaFontSize?: string | number;
  className?: string;
}

export function ProveedorDetailHeader({
  name = 'Carnes del Valle S.A.S',
  code = 'SUP-001',
  taxId = '900.123.456-7',
  status = 'active',
  onBack,
  backLabel = 'Volver',
  actions,
  theme = 'light',
  size = 'md',
  nameFontSize,
  metaFontSize,
  className,
}: ProveedorDetailHeaderProps): JSX.Element {
  const headerStyle = {
    ...(nameFontSize !== undefined && { '--name-size': toCssFontSize(nameFontSize) }),
    ...(metaFontSize !== undefined && { '--meta-size': toCssFontSize(metaFontSize) }),
  } as React.CSSProperties;

  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      style={headerStyle}
    >
      <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
        <ChevronLeft aria-hidden />
      </button>
      <div className={styles.identity}>
        <div className={styles.titleRow}>
          <h1 className={styles.name}>{name}</h1>
          <ProveedorStatusBadge domain="supplier" status={status} theme={theme} size="md" />
        </div>
        <p className={styles.meta}>
          {code} · NIT {taxId}
        </p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default ProveedorDetailHeader;
