import { ProveedorTableHeader, type ProveedorTableRowProps } from '@restopsiq/ui';

import { ResponsiveTable } from '@/components/responsive-table';
import {
  ProveedorSupplierCard,
  ProveedorSupplierRow,
} from '@/components/proveedores/proveedor-responsive';
import { PROVEEDOR_SUPPLIER_RESPONSIVE_COLUMNS } from '@/features/proveedores/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';

const SUPPLIER_HEADER_ALIGN = {
  status: 'center',
  products: 'center',
} as const;

export interface ProveedorSuppliersResponsiveTableProps {
  rows: ProveedorTableRowProps[];
  onRowClick?: (supplierId: string) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

export function ProveedorSuppliersResponsiveTable({
  rows,
  onRowClick,
  emptyState,
  className,
}: ProveedorSuppliersResponsiveTableProps): React.JSX.Element {
  const theme = rows[0]?.theme ?? 'light';
  const size = rows[0]?.size ?? 'xl';

  if (rows.length === 0) {
    return <div className={className}>{emptyState ?? <span>Sin proveedores</span>}</div>;
  }

  return (
    <ResponsiveTable<ProveedorTableRowProps>
      columns={PROVEEDOR_SUPPLIER_RESPONSIVE_COLUMNS}
      rows={rows}
      keyExtractor={(row) => row.supplierId ?? row.supplierCode ?? row.name ?? 'row'}
      className={className}
      cardBelow="laptop"
      renderTableHeader={({ visibleColumns }) => (
        <ProveedorTableHeader
          columns={headerColumnsFromResponsive(visibleColumns, SUPPLIER_HEADER_ALIGN)}
          theme={theme}
          size={size}
        />
      )}
      renderTableRow={(row, { visibleColumns, columnsTemplate }) => (
        <ProveedorSupplierRow
          row={row}
          visibleColumns={visibleColumns}
          columnsTemplate={columnsTemplate}
          onClick={
            onRowClick && row.supplierId ? () => onRowClick(row.supplierId as string) : undefined
          }
        />
      )}
      renderCard={(row) => (
        <ProveedorSupplierCard
          row={row}
          onClick={
            onRowClick && row.supplierId ? () => onRowClick(row.supplierId as string) : undefined
          }
        />
      )}
    />
  );
}
