import React, { type JSX } from 'react';

import { SedeActionButton } from '../sede-action-button';
import { SedeKpiCard } from '../sede-kpi-card';
import { SedeKpiGrid } from '../sede-kpi-grid';
import { SedeListToolbar } from '../sede-list-toolbar';
import { SedePage } from '../sede-page';
import { SedePageHeader } from '../sede-page-header';
import { SedePageSection } from '../sede-page-section';
import { SedeTable } from '../sede-table';
import { SedeTableItem } from '../sede-table-item';
import type { SedeAssignedUser, SedeSize, SedeStatusFilter, SedeTheme } from '../shared/sede-types';

export interface SedeListPreviewRow {
  id: string;
  name: string;
  createdAt?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive: boolean;
  assignedUsers?: SedeAssignedUser[];
}

export interface SedeListPreviewProps {
  title?: string;
  subtitle?: string;
  totalCount?: number;
  activeCount?: number;
  inactiveCount?: number;
  rows?: SedeListPreviewRow[];
  searchValue?: string;
  statusFilter?: SedeStatusFilter;
  onSearchChange?: (value: string) => void;
  onStatusFilterChange?: (filter: SedeStatusFilter) => void;
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

const defaultRows: SedeListPreviewRow[] = [
  {
    id: 'sed-08',
    name: 'Sede Bocagrande',
    createdAt: '2024-04-12',
    address: 'Av. San Martín # 6-40',
    city: 'Cartagena',
    phone: '+57 605 901 2345',
    isActive: true,
    assignedUsers: [
      {
        id: 'u1',
        name: 'Ana López',
        email: 'a@x.com',
        roleLabel: 'Operadora',
        initials: 'AL',
        tone: 'teal',
      },
      {
        id: 'u2',
        name: 'Roberto Silva',
        email: 'r@x.com',
        roleLabel: 'Operador',
        initials: 'RS',
        tone: 'coral',
      },
    ],
  },
  {
    id: 'sed-09',
    name: 'Sede Bucarica',
    createdAt: '2024-06-03',
    address: 'Calle 45 # 25-10',
    city: 'Cartagena',
    phone: '+57 605 555 1234',
    isActive: true,
    assignedUsers: [],
  },
  {
    id: 'sed-10',
    name: 'Sede Centro',
    createdAt: '2024-01-15',
    address: 'Cra 7 # 32-16',
    city: 'Bogotá',
    phone: '+57 601 234 5678',
    isActive: false,
    assignedUsers: [],
  },
];

export function SedeListPreview({
  title = 'Sedes',
  subtitle,
  totalCount = 10,
  activeCount = 7,
  inactiveCount = 3,
  rows = defaultRows,
  searchValue = '',
  statusFilter = 'all',
  onSearchChange,
  onStatusFilterChange,
  onCreate,
  onEdit,
  onToggleStatus,
  onDelete,
  theme = 'light',
  size = 'md',
  className,
}: SedeListPreviewProps): JSX.Element {
  const resolvedSubtitle = subtitle ?? 'Gestión de sedes del tenant';

  return (
    <SedePage theme={theme} size={size} layout="sections" className={className}>
      <SedePageSection theme={theme} divider variant="header">
        <SedePageHeader
          title={title}
          subtitle={resolvedSubtitle}
          theme={theme}
          size={size}
          primaryAction={<SedeActionButton theme={theme} size={size} onClick={onCreate} />}
        />
      </SedePageSection>

      <SedePageSection theme={theme} divider>
        <SedeKpiGrid theme={theme} size={size}>
          <SedeKpiCard label="Total sedes" value={totalCount} valueColor="primary" theme={theme} />
          <SedeKpiCard label="Activas" value={activeCount} valueColor="success" theme={theme} />
          <SedeKpiCard label="Inactivas" value={inactiveCount} valueColor="muted" theme={theme} />
        </SedeKpiGrid>
      </SedePageSection>

      <SedePageSection theme={theme} divider variant="toolbar">
        <SedeListToolbar
          searchValue={searchValue}
          statusFilter={statusFilter}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          theme={theme}
          size={size}
        />
      </SedePageSection>

      <SedePageSection theme={theme}>
        <SedeTable
          theme={theme}
          size={size}
          pagination={{
            page: 1,
            totalPages: 2,
            summary: `Mostrando 1-${rows.length} de ${totalCount}`,
          }}
        >
          {rows.map((row) => (
            <SedeTableItem
              key={row.id}
              {...row}
              theme={theme}
              size={size}
              onEdit={() => onEdit?.(row.id)}
              onToggleStatus={() => onToggleStatus?.(row.id)}
              onDelete={() => onDelete?.(row.id)}
            />
          ))}
        </SedeTable>
      </SedePageSection>
    </SedePage>
  );
}

export default SedeListPreview;
