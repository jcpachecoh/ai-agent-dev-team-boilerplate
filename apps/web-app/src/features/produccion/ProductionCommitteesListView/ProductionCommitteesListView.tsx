import {
  InventarioPageToolbar,
  InventarioPrimaryButton,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaSearch,
  RecetaTableHeader,
  type RecetaTableColumn,
} from '@restopsiq/ui';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { CreateProductionCommitteeModal } from '../components/CreateProductionCommitteeModal';

import {
  ProductionCommitteeListCard,
  ProductionCommitteeListRow,
} from '@/components/produccion/produccion-responsive';
import { ResponsiveTable } from '@/components/responsive-table';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { recetaTableColumnsForVisible } from '@/features/recetas/recipe-list-columns';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import { COMMITTEE_STATUS_FILTER_OPTIONS, RECETA_TABLE_SIZE } from '../constants';
import { PRODUCTION_COMMITTEE_RESPONSIVE_COLUMNS } from '../responsive-columns';
import { useProductionCommittees } from '../hooks/useProductionCommittees';
import { formatCommitteeStatus } from '../mappers/display';
import type { ListProductionCommitteesFilters, ProductionCommitteeListItem } from '../types';
import styles from '../produccion.module.scss';

const TABLE_COLUMNS: RecetaTableColumn[] = [
  { key: 'number', label: 'Número', width: 'minmax(7rem, 0.9fr)' },
  { key: 'status', label: 'Estado', width: 'minmax(6rem, 0.8fr)' },
  { key: 'members', label: 'Miembros', width: 'minmax(5rem, 0.7fr)' },
  { key: 'orders', label: 'OPs creadas', width: 'minmax(5rem, 0.7fr)' },
  { key: 'created', label: 'Creado', width: 'minmax(8rem, 1fr)' },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export default function ProductionCommitteesListView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [committeeFilter, setCommitteeFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filters = useMemo((): ListProductionCommitteesFilters => {
    const result: ListProductionCommitteesFilters = {};
    if (statusFilter !== 'all') {
      result.status = statusFilter as ListProductionCommitteesFilters['status'];
    }
    return result;
  }, [statusFilter]);

  const committeesQuery = useProductionCommittees(filters);
  const allCommitteesQuery = useProductionCommittees({});
  const committees = committeesQuery.data ?? [];

  const committeeFilterOptions = useMemo(() => {
    const allCommittees = allCommitteesQuery.data ?? [];
    return [
      { value: 'all', label: 'Todos los comités' },
      ...allCommittees.map((committee) => ({
        value: committee.id,
        label: committee.number,
      })),
    ];
  }, [allCommitteesQuery.data]);

  const filteredCommittees = useMemo(() => {
    let list = committees;
    if (committeeFilter !== 'all') {
      list = list.filter((committee) => committee.id === committeeFilter);
    }

    const term = search.trim().toLowerCase();
    if (!term) return list;

    return list.filter((committee) => {
      const haystack = [
        committee.number,
        formatCommitteeStatus(committee.status),
        String(committee.memberCount),
        String(committee.ordersCount),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [committeeFilter, committees, search]);

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (state?.openCreate) {
      setCreateModalOpen(true);
    }
    if (location.pathname.endsWith('/nuevo')) {
      setCreateModalOpen(true);
      navigate('/produccion/comites', { replace: true, state: state ?? {} });
    }
  }, [location.pathname, location.state, navigate]);

  const metrics = useMemo(() => {
    const active = filteredCommittees.filter((c) => c.status === 'ACTIVE').length;
    const closed = filteredCommittees.filter((c) => c.status === 'CLOSED').length;
    const totalOrders = filteredCommittees.reduce((sum, c) => sum + c.ordersCount, 0);
    return { total: filteredCommittees.length, active, closed, totalOrders };
  }, [filteredCommittees]);

  return (
    <div className={styles.content}>
      <InventarioPageToolbar
        theme={theme}
        size="md"
        title="Comités de producción"
        subtitle={`${metrics.total} comités · ${metrics.active} activos · ${metrics.totalOrders} OPs agrupadas`}
        action={
          <InventarioPrimaryButton
            theme={theme}
            size="md"
            variant="orange"
            label="NUEVO COMITÉ"
            icon={<Plus aria-hidden />}
            onClick={() => setCreateModalOpen(true)}
          />
        }
      />

      <div className={[styles.filtersRow, styles.filtersRowThree].join(' ')}>
        <RecetaSearch
          theme={theme}
          size={RECETA_TABLE_SIZE}
          value={search}
          onChange={setSearch}
          placeholder="Buscar comité…"
          ariaLabel="Buscar comités de producción"
          className={styles.searchGrow}
        />
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por estado"
            value={statusFilter}
            options={[...COMMITTEE_STATUS_FILTER_OPTIONS]}
            onChange={setStatusFilter}
          />
        </div>
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por comité"
            value={committeeFilter}
            options={committeeFilterOptions}
            onChange={setCommitteeFilter}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
          gap: '0.75rem',
        }}
      >
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Total comités"
          value={String(metrics.total)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Activos"
          value={String(metrics.active)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Cerrados"
          value={String(metrics.closed)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="OPs en comités"
          value={String(metrics.totalOrders)}
        />
      </div>

      {committeesQuery.isPending && (
        <InventoryScreenState variant="loading" message="Cargando comités…" />
      )}

      {committeesQuery.isError && (
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(committeesQuery.error)}
        </div>
      )}

      {!committeesQuery.isPending &&
        !committeesQuery.isError &&
        filteredCommittees.length === 0 && (
          <InventoryScreenState
            variant="empty"
            message={
              committees.length === 0
                ? 'No hay comités de producción. Cree el primero para agrupar órdenes bajo un consecutivo OP0001.'
                : 'No hay comités que coincidan con los filtros o la búsqueda.'
            }
          />
        )}

      {filteredCommittees.length > 0 && (
        <div className={styles.tableWrap}>
          <ResponsiveTable<ProductionCommitteeListItem>
            columns={PRODUCTION_COMMITTEE_RESPONSIVE_COLUMNS}
            rows={filteredCommittees}
            keyExtractor={(committee) => committee.id}
            className={styles.responsiveTable}
            renderTableHeader={({ visibleColumns }) => (
              <RecetaTableHeader
                theme={theme}
                size={RECETA_TABLE_SIZE}
                columns={recetaTableColumnsForVisible(TABLE_COLUMNS, visibleColumns)}
              />
            )}
            renderTableRow={(committee, { visibleColumns, columnsTemplate }) => (
              <div
                className={styles.tableRow}
                onClick={() => navigate(`/produccion/comites/${committee.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/produccion/comites/${committee.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <ProductionCommitteeListRow
                  committee={committee}
                  theme={theme}
                  visibleColumns={visibleColumns}
                  columnsTemplate={columnsTemplate}
                />
              </div>
            )}
            renderCard={(committee) => (
              <ProductionCommitteeListCard
                committee={committee}
                theme={theme}
                onOpen={() => navigate(`/produccion/comites/${committee.id}`)}
              />
            )}
          />
        </div>
      )}

      <CreateProductionCommitteeModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(committeeId) => navigate(`/produccion/comites/${committeeId}`)}
      />
    </div>
  );
}
