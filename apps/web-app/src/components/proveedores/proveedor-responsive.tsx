import {
  EmpleadoRowActionButton,
  ProveedorStatusBadge,
  type ProveedorCatalogTableRowProps,
  type ProveedorTableRowProps,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './proveedor-responsive.module.scss';

interface RowBaseProps {
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
}

function ResponsiveGridRow({
  visibleColumns,
  columnsTemplate,
  children,
}: RowBaseProps & { children: (columnId: string) => React.ReactNode }): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--proveedor-columns': columnsTemplate } as CSSProperties}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={styles.cell} role="cell">
          {children(column.id)}
        </span>
      ))}
    </div>
  );
}

export interface ProveedorSupplierRowProps extends RowBaseProps {
  row: ProveedorTableRowProps;
  onClick?: () => void;
}

export function ProveedorSupplierRow({
  row,
  visibleColumns,
  columnsTemplate,
  onClick,
}: ProveedorSupplierRowProps): React.JSX.Element {
  const theme = row.theme ?? 'light';
  const idLabel = row.supplierCode ?? row.supplierId ?? '—';

  const renderCell = (columnId: string): React.ReactNode => {
    switch (columnId) {
      case 'id':
        return (
          <span className={styles.id} title={idLabel}>
            {idLabel}
          </span>
        );
      case 'name':
        return (
          <span className={styles.name} title={row.name}>
            {row.name}
          </span>
        );
      case 'category':
        return <span className={styles.muted}>{row.category}</span>;
      case 'status':
        return row.status ? (
          <ProveedorStatusBadge domain="supplier" status={row.status} theme={theme} size="sm" />
        ) : null;
      case 'payment':
        return <span className={styles.muted}>{row.paymentTerms}</span>;
      case 'leadTime':
        return <span className={styles.muted}>{row.leadTime}</span>;
      case 'reliability':
        return <span className={styles.reliability}>{row.reliability}</span>;
      case 'products':
        return <span className={styles.muted}>{row.productCount}</span>;
      case 'balance':
        return <span className={styles.balance}>{row.balance}</span>;
      case 'lastPo':
        return <span className={styles.muted}>{row.lastPurchaseOrder}</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={[styles.row, onClick ? styles.clickable : ''].filter(Boolean).join(' ')}
      role="row"
      style={{ '--proveedor-columns': columnsTemplate } as CSSProperties}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={styles.cell} role="cell">
          {renderCell(column.id)}
        </span>
      ))}
    </div>
  );
}

export function ProveedorSupplierCard({
  row,
  onClick,
}: {
  row: ProveedorTableRowProps;
  onClick?: () => void;
}): React.JSX.Element {
  const theme = row.theme ?? 'light';
  const idLabel = row.supplierCode ?? row.supplierId ?? '—';

  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.id}>{idLabel}</span>
          <span className={styles.name}>{row.name}</span>
        </span>
      }
      badge={
        row.status ? (
          <ProveedorStatusBadge domain="supplier" status={row.status} theme={theme} size="sm" />
        ) : undefined
      }
      fields={[
        { label: 'Categoría', value: row.category ?? '—' },
        { label: 'Condición pago', value: row.paymentTerms ?? '—' },
        { label: 'Lead time', value: row.leadTime ?? '—' },
        { label: 'Confiabilidad', value: row.reliability ?? '—' },
        { label: 'Productos', value: String(row.productCount ?? '—') },
        { label: 'Saldo CXP', value: row.balance ?? '—' },
        { label: 'Última OC', value: row.lastPurchaseOrder ?? '—' },
      ]}
      onClick={onClick}
    />
  );
}

export interface ProveedorCatalogRowProps extends RowBaseProps {
  row: ProveedorCatalogTableRowProps;
}

export function ProveedorCatalogRow({
  row,
  visibleColumns,
  columnsTemplate,
}: ProveedorCatalogRowProps): React.JSX.Element {
  const theme = row.theme ?? 'light';
  const trendSuffix = row.priceTrend === 'up' ? '↑' : row.priceTrend === 'down' ? '↓' : '';

  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'product':
            return <span className={styles.name}>{row.productName}</span>;
          case 'sku':
            return <span className={styles.muted}>{row.sku}</span>;
          case 'unit':
            return <span className={styles.muted}>{row.unit}</span>;
          case 'currentPrice':
            return (
              <span
                className={[
                  styles.price,
                  row.priceTrend === 'up' && styles.priceUp,
                  row.priceTrend === 'down' && styles.priceDown,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {row.currentPrice}
                {trendSuffix}
              </span>
            );
          case 'previousPrice':
            return <span className={styles.muted}>{row.previousPrice}</span>;
          case 'moq':
            return <span className={styles.muted}>{row.moq}</span>;
          case 'status':
            return row.status ? (
              <ProveedorStatusBadge domain="catalog" status={row.status} theme={theme} size="sm" />
            ) : null;
          case 'actions':
            return (
              <span className={styles.actions}>
                <EmpleadoRowActionButton
                  variant="edit"
                  theme={theme}
                  size="sm"
                  aria-label="Editar producto"
                  onClick={row.onEdit}
                />
              </span>
            );
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function ProveedorCatalogCard({
  row,
}: {
  row: ProveedorCatalogTableRowProps;
}): React.JSX.Element {
  const theme = row.theme ?? 'light';
  const trendSuffix = row.priceTrend === 'up' ? '↑' : row.priceTrend === 'down' ? '↓' : '';

  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.muted}>{row.sku}</span>
          <span className={styles.name}>{row.productName}</span>
        </span>
      }
      badge={
        row.status ? (
          <ProveedorStatusBadge domain="catalog" status={row.status} theme={theme} size="sm" />
        ) : undefined
      }
      fields={[
        { label: 'Unidad', value: row.unit ?? '—' },
        {
          label: 'Precio actual',
          value: (
            <>
              {row.currentPrice}
              {trendSuffix}
            </>
          ),
        },
        { label: 'Precio anterior', value: row.previousPrice ?? '—' },
        { label: 'MOQ', value: row.moq ?? '—' },
      ]}
      footer={
        <EmpleadoRowActionButton
          variant="edit"
          theme={theme}
          size="sm"
          aria-label="Editar producto"
          onClick={row.onEdit}
        />
      }
    />
  );
}
