import React, { type JSX } from 'react';

import type {
  ProveedorCatalogStatus,
  ProveedorSize,
  ProveedorSupplierStatus,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorStatusBadge.module.scss';

export type ProveedorStatusBadgeDomain = 'supplier' | 'catalog';

export type ProveedorStatusBadgeStatus = ProveedorSupplierStatus | ProveedorCatalogStatus;

export interface ProveedorStatusBadgeProps {
  domain?: ProveedorStatusBadgeDomain;
  status?: ProveedorStatusBadgeStatus;
  label?: string;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const supplierLabels: Record<ProveedorSupplierStatus, string> = {
  active: 'ACTIVO',
  inactive: 'INACTIVO',
  pending: 'PENDIENTE',
};

const catalogLabels: Record<ProveedorCatalogStatus, string> = {
  available: 'DISPONIBLE',
  limited: 'LIMITADO',
};

export function ProveedorStatusBadge({
  domain = 'supplier',
  status = 'active',
  label,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorStatusBadgeProps): JSX.Element {
  const resolvedLabel =
    label ??
    (domain === 'catalog'
      ? catalogLabels[status as ProveedorCatalogStatus]
      : supplierLabels[status as ProveedorSupplierStatus]);

  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`domain--${domain}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {resolvedLabel}
    </span>
  );
}

export default ProveedorStatusBadge;
