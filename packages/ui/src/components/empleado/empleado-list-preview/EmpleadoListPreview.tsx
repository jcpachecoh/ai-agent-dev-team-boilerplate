import type { JSX } from 'react';
import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RecetaMetricCard } from '../../receta/receta-metric-card';
import { EmpleadoActionButton } from '../empleado-action-button';
import { EmpleadoListToolbar } from '../empleado-list-toolbar';
import { EmpleadoPage } from '../empleado-page';
import { EmpleadoPageHeader } from '../empleado-page-header';
import { EmpleadoPageSection } from '../empleado-page-section';
import { EmpleadoTable } from '../empleado-table';
import { EmpleadoTableItem } from '../empleado-table-item';
import type {
  EmpleadoSize,
  EmpleadoStatusFilterValue,
  EmpleadoTheme,
} from '../shared/empleado-types';
import type { EmpleadoSortColumnKey, EmpleadoSortDirection } from '../shared/empleado-columns';
import type { EmpleadoTableRowProps } from '../empleado-table-row';
import { toggleEmpleadoSort } from '../shared/empleado-utils';
import styles from './EmpleadoListPreview.module.scss';

export interface EmpleadoListPreviewProps {
  title?: string;
  subtitle?: string;
  totalCount?: number;
  activeCount?: number;
  inactiveCount?: number;
  filteredCount?: number;
  rows?: EmpleadoTableRowProps[];
  searchValue?: string;
  statusFilter?: EmpleadoStatusFilterValue;
  onSearchChange?: (value: string) => void;
  onStatusFilterChange?: (filter: EmpleadoStatusFilterValue) => void;
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

const defaultRows: EmpleadoTableRowProps[] = [
  {
    id: 'emp-1',
    name: 'Ana López',
    email: 'a.lopez@palosdelena.com',
    cedula: '1015678234',
    position: 'Chef Principal',
    area: 'Cocina',
    contractType: 'INDEFINIDO',
    locationName: 'Chapinero',
    locationCity: 'Bogotá',
    hireDate: '2021-08-01',
    isActive: true,
  },
  {
    id: 'emp-2',
    name: 'Andrés Moreno',
    email: 'a.moreno@palosdelena.com',
    cedula: '80567890',
    position: 'Parrillero',
    area: 'Cocina',
    contractType: 'INDEFINIDO',
    locationName: 'Zona Rosa',
    locationCity: 'Bogotá',
    hireDate: '2022-03-15',
    isActive: true,
  },
];

export function EmpleadoListPreview({
  title = 'Empleados',
  subtitle,
  totalCount = 18,
  activeCount = 16,
  inactiveCount = 2,
  filteredCount = 18,
  rows = defaultRows,
  searchValue = '',
  statusFilter = 'all',
  onSearchChange,
  onStatusFilterChange,
  onCreate,
  onEdit,
  onToggleStatus,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoListPreviewProps): JSX.Element {
  const [sortColumn, setSortColumn] = useState<EmpleadoSortColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<EmpleadoSortDirection>('asc');

  const resolvedSubtitle =
    subtitle ?? `Todos los empleados del tenant · ${activeCount} activos de ${totalCount}`;

  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;

    const sorted = [...rows];
    sorted.sort((left, right) => {
      let result = 0;

      if (sortColumn === 'employee') {
        result = (left.name ?? '').localeCompare(right.name ?? '', 'es', { sensitivity: 'base' });
      } else if (sortColumn === 'role') {
        const leftRole = `${left.position ?? ''} ${left.area ?? ''}`.trim();
        const rightRole = `${right.position ?? ''} ${right.area ?? ''}`.trim();
        result = leftRole.localeCompare(rightRole, 'es', { sensitivity: 'base' });
      } else if (sortColumn === 'hireDate') {
        result = (left.hireDate ?? '').localeCompare(right.hireDate ?? '', 'es', {
          sensitivity: 'base',
        });
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return sorted;
  }, [rows, sortColumn, sortDirection]);

  const handleSortColumn = (column: EmpleadoSortColumnKey) => {
    const next = toggleEmpleadoSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  return (
    <EmpleadoPage theme={theme} size={size} className={className}>
      <EmpleadoPageSection theme={theme} divider variant="header">
        <EmpleadoPageHeader
          title={title}
          subtitle={resolvedSubtitle}
          theme={theme}
          size={size}
          primaryAction={<EmpleadoActionButton theme={theme} size={size} onClick={onCreate} />}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={theme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Total"
            value={totalCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Activos"
            value={activeCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Inactivos"
            value={inactiveCount}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={theme}
            size="sm"
            title="Filtrados"
            value={filteredCount}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={theme} divider variant="toolbar">
        <EmpleadoListToolbar
          searchValue={searchValue}
          statusFilter={statusFilter}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          theme={theme}
          size={size}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={theme}>
        <EmpleadoTable
          theme={theme}
          size={size}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortColumn={handleSortColumn}
          pagination={{
            page: 1,
            totalPages: 3,
            summary: `1-${sortedRows.length} de ${filteredCount}`,
          }}
        >
          {sortedRows.map((row) => (
            <EmpleadoTableItem
              key={row.id}
              {...row}
              theme={theme}
              size={size}
              onEdit={() => row.id && onEdit?.(row.id)}
              onToggleStatus={() => row.id && onToggleStatus?.(row.id)}
            />
          ))}
        </EmpleadoTable>
      </EmpleadoPageSection>
    </EmpleadoPage>
  );
}

export default EmpleadoListPreview;
