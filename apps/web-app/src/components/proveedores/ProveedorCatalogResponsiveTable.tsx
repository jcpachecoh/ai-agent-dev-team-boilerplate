import { ProveedorCatalogTableHeader, type ProveedorCatalogTableRowProps } from '@restopsiq/ui';

import { ResponsiveTable } from '@/components/responsive-table';
import {
  ProveedorCatalogCard,
  ProveedorCatalogRow,
} from '@/components/proveedores/proveedor-responsive';
import { PROVEEDOR_CATALOG_RESPONSIVE_COLUMNS } from '@/features/proveedores/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';

const CATALOG_HEADER_ALIGN = {
  status: 'center',
  actions: 'right',
} as const;

export interface ProveedorCatalogResponsiveTableProps {
  rows: ProveedorCatalogTableRowProps[];
  emptyState?: React.ReactNode;
  className?: string;
}

export function ProveedorCatalogResponsiveTable({
  rows,
  emptyState,
  className,
}: ProveedorCatalogResponsiveTableProps): React.JSX.Element {
  const theme = rows[0]?.theme ?? 'light';
  const size = rows[0]?.size ?? 'xl';

  if (rows.length === 0) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <ResponsiveTable<ProveedorCatalogTableRowProps>
      columns={PROVEEDOR_CATALOG_RESPONSIVE_COLUMNS}
      rows={rows}
      keyExtractor={(row) =>
        row.rowKey ?? (typeof row.sku === 'string' ? row.sku : String(row.productName))
      }
      className={className}
      renderTableHeader={({ visibleColumns }) => (
        <ProveedorCatalogTableHeader
          columns={headerColumnsFromResponsive(visibleColumns, CATALOG_HEADER_ALIGN)}
          theme={theme}
          size={size}
        />
      )}
      renderTableRow={(row, { visibleColumns, columnsTemplate }) => (
        <ProveedorCatalogRow
          row={row}
          visibleColumns={visibleColumns}
          columnsTemplate={columnsTemplate}
        />
      )}
      renderCard={(row) => <ProveedorCatalogCard row={row} />}
    />
  );
}
