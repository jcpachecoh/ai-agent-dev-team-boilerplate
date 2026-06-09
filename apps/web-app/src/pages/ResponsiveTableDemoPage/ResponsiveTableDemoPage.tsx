import { StatusBadge } from '@restopsiq/ui';

import { ResponsiveTable } from '@/components/responsive-table';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './ResponsiveTableDemoPage.module.scss';

interface DemoRow {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  category: string;
  updated: string;
  notes: string;
}

const DEMO_COLUMNS: ResponsiveColumnDef[] = [
  {
    id: 'code',
    label: 'Código',
    priority: 1,
    gridTrack: 'minmax(5rem, 0.7fr)',
    cardLabel: 'Código',
  },
  {
    id: 'name',
    label: 'Nombre',
    priority: 1,
    gridTrack: 'minmax(8rem, 1.2fr)',
    cardLabel: 'Nombre',
  },
  {
    id: 'status',
    label: 'Estado',
    priority: 2,
    gridTrack: 'minmax(5rem, 0.7fr)',
    cardLabel: 'Estado',
  },
  {
    id: 'category',
    label: 'Categoría',
    priority: 3,
    gridTrack: 'minmax(6rem, 0.8fr)',
    cardLabel: 'Categoría',
  },
  {
    id: 'updated',
    label: 'Actualizado',
    priority: 4,
    gridTrack: 'minmax(6rem, 0.8fr)',
    cardLabel: 'Actualizado',
  },
  {
    id: 'notes',
    label: 'Notas',
    priority: 5,
    gridTrack: 'minmax(4rem, 0.5fr)',
    cardLabel: 'Notas',
  },
];

const DEMO_ROWS: DemoRow[] = [
  {
    id: '1',
    code: 'SKU-001',
    name: 'Pollo entero',
    status: 'active',
    category: 'Proteínas',
    updated: '09/06/2026',
    notes: 'Stock OK',
  },
  {
    id: '2',
    code: 'SKU-014',
    name: 'Aceite vegetal 20L',
    status: 'inactive',
    category: 'Insumos',
    updated: '08/06/2026',
    notes: 'Revisar proveedor',
  },
  {
    id: '3',
    code: 'SKU-032',
    name: 'Cebolla blanca',
    status: 'active',
    category: 'Verduras',
    updated: '07/06/2026',
    notes: '—',
  },
];

function statusLabel(status: DemoRow['status']): string {
  return status === 'active' ? 'Activo' : 'Inactivo';
}

export default function ResponsiveTableDemoPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Responsive table demo</h1>
        <p className={styles.subtitle}>
          Redimensiona el viewport: en &lt; 640px las filas se muestran como cards; en anchos
          mayores se ocultan columnas de menor prioridad.
        </p>
      </header>

      <ResponsiveTable
        columns={DEMO_COLUMNS}
        rows={DEMO_ROWS}
        keyExtractor={(row) => row.id}
        getCardTitle={(row) => row.name}
        getCardBadge={(row) => (
          <StatusBadge
            status={row.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
            variant="pill"
            size="sm"
            theme="dark"
          />
        )}
        getCardFieldValue={(row, column) => {
          const value = row[column.id as keyof DemoRow];
          if (column.id === 'status') return statusLabel(row.status);
          return value ?? '—';
        }}
        renderTableHeader={({ visibleColumns, columnsTemplate }) => (
          <div
            className={styles.tableHeader}
            style={{ gridTemplateColumns: columnsTemplate }}
            role="row"
          >
            {visibleColumns.map((column) => (
              <span key={column.id} className={styles.headerCell} role="columnheader">
                {column.label}
              </span>
            ))}
          </div>
        )}
        renderTableRow={(row, { visibleColumns, columnsTemplate }) => (
          <div
            className={styles.tableRow}
            style={{ gridTemplateColumns: columnsTemplate }}
            role="row"
          >
            {visibleColumns.map((column) => (
              <span key={column.id} className={styles.cell} role="cell">
                {column.id === 'status' ? statusLabel(row.status) : row[column.id as keyof DemoRow]}
              </span>
            ))}
          </div>
        )}
        emptyState={<p className={styles.empty}>Sin datos</p>}
      />
    </div>
  );
}
