import React, { type JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type {
  ProveedorCatalogStatus,
  ProveedorOcHistoryStatus,
  ProveedorPayableStatus,
  ProveedorQualityComplianceStatus,
  ProveedorSize,
  ProveedorSupplierStatus,
  ProveedorTheme,
} from '../shared/proveedor-types';
import styles from './ProveedorStatusBadge.module.scss';

export type ProveedorStatusBadgeDomain =
  | 'supplier'
  | 'catalog'
  | 'oc-history'
  | 'quality'
  | 'payable';

export type ProveedorStatusBadgeStatus =
  | ProveedorSupplierStatus
  | ProveedorCatalogStatus
  | ProveedorOcHistoryStatus
  | ProveedorQualityComplianceStatus
  | ProveedorPayableStatus;

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

const ocHistoryLabels: Record<ProveedorOcHistoryStatus, string> = {
  delivered: 'ENTREGADO',
  pending: 'PENDIENTE',
  cancelled: 'CANCELADA',
};

const qualityLabels: Record<ProveedorQualityComplianceStatus, string> = {
  conform: 'CONFORME',
  'non-conform': 'NO CONFORME',
};

const payableLabels: Record<ProveedorPayableStatus, string> = {
  pending: 'PENDIENTE',
  paid: 'PAGADO',
  overdue: 'VENCIDO',
};

function resolveLabel(
  domain: ProveedorStatusBadgeDomain,
  status: ProveedorStatusBadgeStatus,
  label?: string,
): string {
  if (label) return label;
  switch (domain) {
    case 'catalog':
      return catalogLabels[status as ProveedorCatalogStatus];
    case 'oc-history':
      return ocHistoryLabels[status as ProveedorOcHistoryStatus];
    case 'quality':
      return qualityLabels[status as ProveedorQualityComplianceStatus];
    case 'payable':
      return payableLabels[status as ProveedorPayableStatus];
    default:
      return supplierLabels[status as ProveedorSupplierStatus];
  }
}

export function ProveedorStatusBadge({
  domain = 'supplier',
  status = 'active',
  label,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorStatusBadgeProps): JSX.Element {
  const resolvedLabel = resolveLabel(domain, status, label);

  if (domain === 'supplier' && (status === 'active' || status === 'inactive')) {
    return (
      <ActiveInactiveStatusBadge
        status={status}
        label={resolvedLabel}
        theme={theme}
        size={size === 'sm' ? 'sm' : 'md'}
        className={className}
      />
    );
  }

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
