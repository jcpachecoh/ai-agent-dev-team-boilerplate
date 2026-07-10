import {
  CargoActionButton,
  CargoListToolbar,
  CargoPage,
  CargoPageHeader,
  CargoPageSection,
  CargoTable,
  CargoTableItem,
  EmptyState,
  LoadingState,
  RecetaMetricCard,
  toast,
  toggleCargoSort,
  type CargoSortColumnKey,
  type CargoSortDirection,
} from '@restopsiq/ui';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { isPayrollReadOnlyRole } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import styles from './EmployeePositionsListScreen.module.scss';
import { PayrollApiError } from '../api/payroll.client';
import { EmployeePositionCreateModal } from '../components/EmployeePositionCreateModal';
import { EmployeePositionDeactivateDialog } from '../components/EmployeePositionDeactivateDialog';
import { EmployeePositionEditDrawer } from '../components/EmployeePositionEditDrawer';
import {
  useCreateEmployeePositionMutation,
  useDeactivateEmployeePositionMutation,
  useUpdateEmployeePositionMutation,
} from '../hooks/useEmployeePositionMutations';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import { useEmployeePositionsFilters } from '../hooks/useEmployeePositionsFilters';
import {
  parseEmployeePositionSalary,
  type CreateEmployeePositionInput,
  type EmployeePosition,
  type EmployeePositionFormValues,
  type UpdateEmployeePositionInput,
} from '../types/employee-position.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

function toCreateInput(values: EmployeePositionFormValues): CreateEmployeePositionInput {
  return {
    title: values.title.trim(),
    area: values.area.trim(),
    baseSalaryRange: parseEmployeePositionSalary(values.baseSalaryRange),
    supervisorPositionIds: values.supervisorPositionIds,
  };
}

function toUpdateInput(values: EmployeePositionFormValues): UpdateEmployeePositionInput {
  return {
    title: values.title.trim(),
    area: values.area.trim(),
    baseSalaryRange: parseEmployeePositionSalary(values.baseSalaryRange),
    isActive: values.isActive,
    supervisorPositionIds: values.supervisorPositionIds,
  };
}

function sortEmployeePositions(
  positions: EmployeePosition[],
  sortColumn: CargoSortColumnKey | null,
  sortDirection: CargoSortDirection,
): EmployeePosition[] {
  if (!sortColumn) {
    return positions;
  }

  const sorted = [...positions].sort((left, right) => {
    const leftValue = sortColumn === 'title' ? left.title : left.area;
    const rightValue = sortColumn === 'title' ? right.title : right.area;
    return leftValue.localeCompare(rightValue, 'es', { sensitivity: 'base' });
  });

  return sortDirection === 'asc' ? sorted : sorted.reverse();
}

export function EmployeePositionsListScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const cargoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const readOnly = isPayrollReadOnlyRole(roleCode);

  const { state, setSearch, setStatusFilter, setPage, queryFilters } =
    useEmployeePositionsFilters(8);
  const positionsQuery = useEmployeePositions(queryFilters);
  const createPosition = useCreateEmployeePositionMutation();
  const updatePosition = useUpdateEmployeePositionMutation();
  const deactivatePosition = useDeactivateEmployeePositionMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<EmployeePosition | undefined>();
  const [statusChangePosition, setStatusChangePosition] = useState<EmployeePosition | undefined>();
  const [sortColumn, setSortColumn] = useState<CargoSortColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<CargoSortDirection>('asc');

  const positions = positionsQuery.data ?? [];

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesStatus =
        state.statusFilter === 'all' ||
        (state.statusFilter === 'active' && position.isActive) ||
        (state.statusFilter === 'inactive' && !position.isActive);

      return matchesStatus;
    });
  }, [positions, state.statusFilter]);

  const sortedPositions = useMemo(
    () => sortEmployeePositions(filteredPositions, sortColumn, sortDirection),
    [filteredPositions, sortColumn, sortDirection],
  );

  const paginatedPositions = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    return sortedPositions.slice(start, start + state.pageSize);
  }, [sortedPositions, state.page, state.pageSize]);

  const handleSortColumn = (column: CargoSortColumnKey) => {
    const next = toggleCargoSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const totalCount = positions.length;
  const activeCount = positions.filter((position) => position.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const filteredCount = filteredPositions.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / state.pageSize));
  const pageStart = filteredCount === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const pageEnd = Math.min(state.page * state.pageSize, filteredCount);

  const handleCreate = async (values: EmployeePositionFormValues) => {
    try {
      await createPosition.mutateAsync(toCreateInput(values));
      toast.success('Cargo creado correctamente');
      setCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = async (values: EmployeePositionFormValues) => {
    if (!editingPosition) {
      return;
    }

    try {
      await updatePosition.mutateAsync({
        id: editingPosition.id,
        input: toUpdateInput(values),
      });
      toast.success('Cargo actualizado');
      setEditingPosition(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStatusChange = async () => {
    if (!statusChangePosition) {
      return;
    }

    try {
      if (statusChangePosition.isActive) {
        await deactivatePosition.mutateAsync(statusChangePosition.id);
        toast.success('Cargo desactivado');
      } else {
        await updatePosition.mutateAsync({
          id: statusChangePosition.id,
          input: { isActive: true },
        });
        toast.success('Cargo activado');
      }
      setStatusChangePosition(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const emptyMessage =
    positions.length === 0
      ? 'No hay cargos registrados'
      : 'No hay cargos para los filtros seleccionados';

  return (
    <CargoPage theme={cargoTheme} className={styles.screen}>
      <CargoPageSection theme={cargoTheme} divider variant="header">
        <CargoPageHeader
          title="Gestión de Cargos"
          subtitle={`Catálogo de cargos del tenant · ${activeCount} activos de ${totalCount}`}
          theme={cargoTheme}
          primaryAction={
            readOnly ? undefined : (
              <CargoActionButton theme={cargoTheme} onClick={() => setCreateOpen(true)} />
            )
          }
        />
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={cargoTheme}
            size="sm"
            title="Total"
            value={totalCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={cargoTheme}
            size="sm"
            title="Activos"
            value={activeCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={cargoTheme}
            size="sm"
            title="Inactivos"
            value={inactiveCount}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={cargoTheme}
            size="sm"
            title="Filtrados"
            value={filteredCount}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} divider variant="toolbar">
        {readOnly ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar cargos. Para crear, editar o desactivar registros,
            contacta a un administrador.
          </p>
        ) : null}
        <CargoListToolbar
          searchValue={state.search}
          statusFilter={state.statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          theme={cargoTheme}
        />
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme}>
        {positionsQuery.isLoading ? (
          <LoadingState
            message="Cargando cargos…"
            theme={cargoTheme === 'dark' ? 'dark' : 'light'}
          />
        ) : null}

        {positionsQuery.isError ? (
          <div className={styles.feedbackState}>
            <EmptyState
              variant="error"
              theme={cargoTheme}
              title="No se pudieron cargar los cargos"
              description="Verifica tu conexión e intenta de nuevo."
              action={
                <CargoActionButton
                  label="Reintentar"
                  icon={<RefreshCw aria-hidden />}
                  theme={cargoTheme}
                  onClick={() => void positionsQuery.refetch()}
                />
              }
            />
          </div>
        ) : null}

        {!positionsQuery.isLoading && !positionsQuery.isError && filteredPositions.length === 0 ? (
          <div className={styles.state}>{emptyMessage}</div>
        ) : null}

        {!positionsQuery.isLoading && !positionsQuery.isError && paginatedPositions.length > 0 ? (
          <CargoTable
            theme={cargoTheme}
            showActions={!readOnly}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
            pagination={{
              page: state.page,
              totalPages,
              summary: `${pageStart}-${pageEnd} de ${filteredCount}`,
              onPrevious: () => setPage(Math.max(1, state.page - 1)),
              onNext: () => setPage(Math.min(totalPages, state.page + 1)),
            }}
          >
            {paginatedPositions.map((position) => (
              <CargoTableItem
                key={position.id}
                id={position.id}
                title={position.title}
                area={position.area}
                supervisors={position.supervisors.map((supervisor) => supervisor.title)}
                baseSalaryRange={position.baseSalaryRange}
                isActive={position.isActive}
                theme={cargoTheme}
                showActions={!readOnly}
                onEdit={readOnly ? undefined : () => setEditingPosition(position)}
                onToggleStatus={readOnly ? undefined : () => setStatusChangePosition(position)}
              />
            ))}
          </CargoTable>
        ) : null}
      </CargoPageSection>

      {!readOnly ? (
        <>
          <EmployeePositionCreateModal
            open={createOpen}
            submitting={createPosition.isPending}
            theme={cargoTheme}
            onClose={() => setCreateOpen(false)}
            onSubmit={(values) => void handleCreate(values)}
          />

          <EmployeePositionEditDrawer
            position={editingPosition}
            open={Boolean(editingPosition)}
            submitting={updatePosition.isPending}
            theme={cargoTheme}
            onClose={() => setEditingPosition(undefined)}
            onSubmit={(values) => void handleEdit(values)}
          />

          <EmployeePositionDeactivateDialog
            position={statusChangePosition}
            open={Boolean(statusChangePosition)}
            submitting={deactivatePosition.isPending || updatePosition.isPending}
            theme={cargoTheme}
            onCancel={() => setStatusChangePosition(undefined)}
            onConfirm={() => void handleStatusChange()}
          />
        </>
      ) : null}
    </CargoPage>
  );
}
