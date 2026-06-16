import {
  SedeActionButton,
  SedeKpiCard,
  SedeKpiGrid,
  SedeListToolbar,
  SedePage,
  SedePageHeader,
  SedePageSection,
  SedeTable,
  SedeTableItem,
  type SedeStatusFilter,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUiTheme } from '@/hooks/useUiTheme';

import { MOCK_SEDES } from '../mock/sedes.mock';

export default function SedesListView(): JSX.Element {
  const navigate = useNavigate();
  const theme = useUiTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SedeStatusFilter>('all');
  const [rows, setRows] = useState(MOCK_SEDES);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && row.isActive) ||
        (statusFilter === 'inactive' && !row.isActive);
      if (!matchesStatus) return false;
      if (!query) return true;
      return [row.name, row.city, row.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const inactiveCount = rows.length - activeCount;

  const handleToggleStatus = (id: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, isActive: !row.isActive } : row)),
    );
    toast.success('Estado de sede actualizado.');
  };

  return (
    <SedePage theme={theme} layout="sections">
      <SedePageSection theme={theme} divider variant="header">
        <SedePageHeader
          title="Sedes"
          subtitle="Gestión de sedes del tenant"
          theme={theme}
          primaryAction={
            <SedeActionButton theme={theme} onClick={() => navigate('/empresa/sedes/nueva')} />
          }
        />
      </SedePageSection>

      <SedePageSection theme={theme} divider>
        <SedeKpiGrid theme={theme}>
          <SedeKpiCard label="Total sedes" value={rows.length} valueColor="primary" theme={theme} />
          <SedeKpiCard label="Activas" value={activeCount} valueColor="success" theme={theme} />
          <SedeKpiCard label="Inactivas" value={inactiveCount} valueColor="muted" theme={theme} />
        </SedeKpiGrid>
      </SedePageSection>

      <SedePageSection theme={theme} divider variant="toolbar">
        <SedeListToolbar
          searchValue={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          theme={theme}
        />
      </SedePageSection>

      <SedePageSection theme={theme}>
        <SedeTable
          theme={theme}
          pagination={{
            page: 1,
            totalPages: 1,
            summary: `Mostrando 1-${filteredRows.length} de ${rows.length}`,
          }}
        >
          {filteredRows.map((row) => (
            <SedeTableItem
              key={row.id}
              {...row}
              theme={theme}
              onEdit={() => navigate(`/empresa/sedes/${row.id}/editar`)}
              onToggleStatus={() => handleToggleStatus(row.id)}
            />
          ))}
        </SedeTable>
      </SedePageSection>
    </SedePage>
  );
}
