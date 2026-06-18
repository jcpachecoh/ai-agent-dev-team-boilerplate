import {
  InventarioIconButton,
  InventarioStatusBadge,
  SedeRowActionButton,
  type InventarioMovementType,
  type InventarioSeverity,
  type InventarioStockTone,
} from '@restopsiq/ui';
import { AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { SupplyCategoryApi } from '@/features/inventario/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';
import {
  STOCK_UNIT_OPTIONS,
  type InventoryAlert,
  type InventoryMovement,
  type InventoryProduct,
  type InventoryResolvedAlert,
} from '@/types/inventory';

import styles from './inventario-responsive.module.scss';

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
      style={{ '--inventario-columns': columnsTemplate } as CSSProperties}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={styles.cell} role="cell">
          {children(column.id)}
        </span>
      ))}
    </div>
  );
}

export interface InventarioProductRowProps extends RowBaseProps {
  product: InventoryProduct;
  theme: UiTheme;
  stockTone: InventarioStockTone;
  unitPrice: string;
  lowStockWarning: boolean;
  onSkuClick: () => void;
  onEdit: () => void;
  onToggleStatus?: () => void;
  toggleLoading?: boolean;
}

export function InventarioProductRow({
  product,
  stockTone,
  unitPrice,
  lowStockWarning,
  visibleColumns,
  columnsTemplate,
  theme,
  onSkuClick,
  onEdit,
  onToggleStatus,
  toggleLoading = false,
}: InventarioProductRowProps): React.JSX.Element {
  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'sku':
            return (
              <button type="button" className={styles.skuLink} onClick={onSkuClick}>
                {product.sku}
              </button>
            );
          case 'name':
            return (
              <span className={styles.name}>
                {product.name}
                {lowStockWarning ? (
                  <AlertTriangle className={styles.warningIcon} aria-label="Stock bajo" />
                ) : null}
              </span>
            );
          case 'category':
            return <span className={styles.muted}>{product.category}</span>;
          case 'supplier':
            return <span className={styles.muted}>{product.supplier}</span>;
          case 'minStock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles['stock--neutral']].join(' ')}>
                  {product.minStock ?? '—'}
                </span>
              </span>
            );
          case 'stock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles[`stock--${stockTone}`]].join(' ')}>
                  {product.currentStock ?? '0'}
                </span>
              </span>
            );
          case 'unit': {
            const unitLabel =
              STOCK_UNIT_OPTIONS.find((o) => o.value === product.unidadBase)?.label ?? '—';
            return <span className={styles.muted}>{unitLabel}</span>;
          }
          case 'price':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={styles.price}>{unitPrice}</span>
              </span>
            );
          case 'estado':
            return (
              <InventarioStatusBadge
                domain="severity"
                status={product.isActive ? 'resolved' : 'warning'}
                label={product.isActive ? 'ACTIVO' : 'INACTIVO'}
                theme={theme}
                size="sm"
              />
            );
          case 'lastMovement':
            return <span className={styles.muted}>{product.lastMovement}</span>;
          case 'actions':
            return (
              <span className={styles.actions}>
                <InventarioIconButton variant="edit" theme={theme} onClick={onEdit} />
                {onToggleStatus ? (
                  <SedeRowActionButton
                    variant="toggle"
                    active={product.isActive}
                    theme={theme}
                    size="sm"
                    onClick={onToggleStatus}
                    disabled={toggleLoading}
                    aria-label={
                      product.isActive
                        ? `Descontinuar ${product.name}`
                        : `Reactivar ${product.name}`
                    }
                  />
                ) : null}
              </span>
            );
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function InventarioProductCard({
  product,
  stockTone,
  unitPrice,
  lowStockWarning,
  theme,
  onSkuClick,
  onEdit,
  onToggleStatus,
  toggleLoading = false,
}: Omit<InventarioProductRowProps, 'visibleColumns' | 'columnsTemplate'>): React.JSX.Element {
  const unitLabel = STOCK_UNIT_OPTIONS.find((o) => o.value === product.unidadBase)?.label ?? '—';

  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <button type="button" className={styles.skuLink} onClick={onSkuClick}>
            {product.sku}
          </button>
          <span className={styles.name}>
            {product.name}
            {lowStockWarning ? (
              <AlertTriangle className={styles.warningIcon} aria-label="Stock bajo" />
            ) : null}
          </span>
        </span>
      }
      badge={
        <InventarioStatusBadge
          domain="severity"
          status={product.isActive ? 'resolved' : 'warning'}
          label={product.isActive ? 'ACTIVO' : 'INACTIVO'}
          theme={theme}
          size="sm"
        />
      }
      fields={[
        {
          label: 'Stock actual',
          value: (
            <span className={[styles.stock, styles[`stock--${stockTone}`]].join(' ')}>
              {product.currentStock ?? '0'}
            </span>
          ),
        },
        { label: 'Categoría', value: product.category },
        { label: 'Proveedor', value: product.supplier },
        {
          label: 'Stock mín.',
          value:
            product.minStock !== null && product.minStock !== undefined
              ? String(product.minStock)
              : '—',
        },
        { label: 'Unidad', value: unitLabel },
        { label: 'Precio Unit.', value: unitPrice },
        { label: 'Último mov.', value: product.lastMovement },
      ]}
      footer={
        <>
          <InventarioIconButton variant="edit" theme={theme} onClick={onEdit} />
          {onToggleStatus ? (
            <SedeRowActionButton
              variant="toggle"
              active={product.isActive}
              theme={theme}
              size="sm"
              onClick={onToggleStatus}
              disabled={toggleLoading}
              aria-label={
                product.isActive ? `Descontinuar ${product.name}` : `Reactivar ${product.name}`
              }
            />
          ) : null}
        </>
      }
    />
  );
}

export interface InventarioCategoryRowProps extends RowBaseProps {
  category: SupplyCategoryApi;
  theme: UiTheme;
  onEdit: () => void;
  onDelete: () => void;
}

export function InventarioCategoryRow({
  category,
  visibleColumns,
  columnsTemplate,
  theme,
  onEdit,
  onDelete,
}: InventarioCategoryRowProps): React.JSX.Element {
  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'nombre':
            return <span className={styles.name}>{category.nombre}</span>;
          case 'prefijo':
            return <span className={styles.muted}>{category.prefijo}</span>;
          case 'descripcion':
            return <span className={styles.muted}>{category.descripcion?.trim() || '—'}</span>;
          case 'estado':
            return (
              <InventarioStatusBadge
                domain="severity"
                status={category.isActive ? 'resolved' : 'warning'}
                label={category.isActive ? 'ACTIVO' : 'INACTIVO'}
                theme={theme}
                size="sm"
              />
            );
          case 'actions':
            return (
              <span className={styles.actions}>
                <InventarioIconButton variant="edit" theme={theme} onClick={onEdit} />
                <InventarioIconButton variant="delete" theme={theme} onClick={onDelete} />
              </span>
            );
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function InventarioCategoryCard({
  category,
  theme,
  onEdit,
  onDelete,
}: Omit<InventarioCategoryRowProps, 'visibleColumns' | 'columnsTemplate'>): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={<span className={styles.name}>{category.nombre}</span>}
      badge={
        <InventarioStatusBadge
          domain="severity"
          status={category.isActive ? 'resolved' : 'warning'}
          label={category.isActive ? 'ACTIVO' : 'INACTIVO'}
          theme={theme}
          size="sm"
        />
      }
      fields={[
        { label: 'Prefijo', value: category.prefijo },
        { label: 'Descripción', value: category.descripcion?.trim() || '—' },
      ]}
      footer={
        <>
          <InventarioIconButton variant="edit" theme={theme} onClick={onEdit} />
          <InventarioIconButton variant="delete" theme={theme} onClick={onDelete} />
        </>
      }
    />
  );
}

export interface InventarioMovementRowProps extends RowBaseProps {
  movement: InventoryMovement;
  quantityLabel: string;
  userLabel: string;
  theme: UiTheme;
}

export function InventarioMovementRow({
  movement,
  quantityLabel,
  userLabel,
  visibleColumns,
  columnsTemplate,
  theme,
}: InventarioMovementRowProps): React.JSX.Element {
  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'date':
            return <span className={styles.muted}>{movement.date}</span>;
          case 'product':
            return <span className={styles.name}>{movement.product}</span>;
          case 'type':
            return (
              <InventarioStatusBadge
                domain="movement"
                status={movement.movementType as InventarioMovementType}
                theme={theme}
                size="sm"
              />
            );
          case 'quantity':
            return <span className={styles.quantity}>{quantityLabel}</span>;
          case 'user':
            return <span className={styles.muted}>{userLabel}</span>;
          case 'reference':
            return <span className={styles.muted}>{movement.reason}</span>;
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function InventarioMovementCard({
  movement,
  quantityLabel,
  userLabel,
  theme,
}: Omit<InventarioMovementRowProps, 'visibleColumns' | 'columnsTemplate'>): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={<span className={styles.name}>{movement.product}</span>}
      badge={
        <InventarioStatusBadge
          domain="movement"
          status={movement.movementType as InventarioMovementType}
          theme={theme}
          size="sm"
        />
      }
      fields={[
        { label: 'Fecha', value: movement.date },
        { label: 'Cantidad', value: quantityLabel },
        { label: 'Usuario', value: userLabel },
        { label: 'Referencia', value: movement.reason },
      ]}
    />
  );
}

export interface InventarioAlertRowProps extends RowBaseProps {
  alert: InventoryAlert;
  theme: UiTheme;
  onOrder: () => void;
  onResolve: () => void;
}

export function InventarioAlertRow({
  alert,
  visibleColumns,
  columnsTemplate,
  theme,
  onOrder,
  onResolve,
}: InventarioAlertRowProps): React.JSX.Element {
  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'severity':
            return (
              <InventarioStatusBadge
                domain="severity"
                status={alert.severity as InventarioSeverity}
                theme={theme}
                size="sm"
              />
            );
          case 'product':
            return <span className={styles.name}>{alert.product}</span>;
          case 'currentStock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles['stock--danger']].join(' ')}>
                  {alert.currentStock ?? '0'}
                </span>
              </span>
            );
          case 'minStock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles['stock--neutral']].join(' ')}>
                  {alert.threshold ?? '—'}
                </span>
              </span>
            );
          case 'supplier':
            return <span className={styles.muted}>{alert.supplier}</span>;
          case 'actions':
            return (
              <span className={styles.actions}>
                <InventarioIconButton variant="order" theme={theme} onClick={onOrder} />
                <InventarioIconButton variant="resolve" theme={theme} onClick={onResolve} />
              </span>
            );
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function InventarioAlertCard({
  alert,
  theme,
  onOrder,
  onResolve,
}: Omit<InventarioAlertRowProps, 'visibleColumns' | 'columnsTemplate'>): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={<span className={styles.name}>{alert.product}</span>}
      badge={
        <InventarioStatusBadge
          domain="severity"
          status={alert.severity as InventarioSeverity}
          theme={theme}
          size="sm"
        />
      }
      fields={[
        { label: 'Stock actual', value: String(alert.currentStock ?? '0') },
        { label: 'Stock mín.', value: String(alert.threshold ?? '—') },
        { label: 'Proveedor', value: alert.supplier },
      ]}
      footer={
        <>
          <InventarioIconButton variant="order" theme={theme} onClick={onOrder} />
          <InventarioIconButton variant="resolve" theme={theme} onClick={onResolve} />
        </>
      }
    />
  );
}

export interface InventarioResolvedAlertRowProps extends RowBaseProps {
  alert: InventoryResolvedAlert;
  theme: UiTheme;
}

export function InventarioResolvedAlertRow({
  alert,
  visibleColumns,
  columnsTemplate,
}: InventarioResolvedAlertRowProps): React.JSX.Element {
  const resolvedLabel = new Date(alert.resolvedAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ResponsiveGridRow visibleColumns={visibleColumns} columnsTemplate={columnsTemplate}>
      {(columnId) => {
        switch (columnId) {
          case 'product':
            return <span className={styles.name}>{alert.product}</span>;
          case 'currentStock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles['stock--neutral']].join(' ')}>
                  {alert.currentStock ?? '0'}
                </span>
              </span>
            );
          case 'minStock':
            return (
              <span className={[styles.cell, styles.number].join(' ')}>
                <span className={[styles.stock, styles['stock--neutral']].join(' ')}>
                  {alert.threshold ?? '—'}
                </span>
              </span>
            );
          case 'supplier':
            return <span className={styles.muted}>{alert.supplier}</span>;
          case 'resolvedAt':
            return <span className={styles.muted}>{resolvedLabel}</span>;
          case 'note':
            return <span className={styles.muted}>{alert.note ?? '—'}</span>;
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function InventarioResolvedAlertCard({
  alert,
}: Omit<InventarioResolvedAlertRowProps, 'visibleColumns' | 'columnsTemplate'>): React.JSX.Element {
  const resolvedLabel = new Date(alert.resolvedAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ResponsiveTableCard
      className={styles.card}
      title={<span className={styles.name}>{alert.product}</span>}
      fields={[
        { label: 'Stock actual', value: String(alert.currentStock ?? '0') },
        { label: 'Stock mín.', value: String(alert.threshold ?? '—') },
        { label: 'Proveedor', value: alert.supplier },
        { label: 'Resuelta el', value: resolvedLabel },
        { label: 'Razón', value: alert.note ?? '—' },
      ]}
    />
  );
}
