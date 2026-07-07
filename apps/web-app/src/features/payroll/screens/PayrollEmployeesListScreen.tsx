import {
  EmpleadoActionButton,
  EmpleadoListToolbar,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  EmpleadoTable,
  EmpleadoTableItem,
  LoadingState,
  RecetaFilterSelect,
  RecetaMetricCard,
  toast,
  toggleEmpleadoSort,
  type EmpleadoSortColumnKey,
  type EmpleadoSortDirection,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';
import { isPayrollReadOnlyRole } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import {
  useCreatePayrollEmployeeMutation,
  useRemovePayrollEmployeeMutation,
  useUpdatePayrollEmployeeMutation,
} from '../hooks/usePayrollEmployeeMutations';
import { usePayrollEmployeesFilters } from '../hooks/usePayrollEmployeesFilters';
import { usePayrollEmployeesQuery } from '../hooks/usePayrollEmployeesQuery';
import type {
  CreatePayrollEmployeeInput,
  PayrollEmployee,
  PayrollEmployeeFormValues,
  UpdatePayrollEmployeeInput,
} from '../types/payroll.types';
import { PayrollDeactivateEmployeeDialog } from '../components/PayrollDeactivateEmployeeDialog';
import { PayrollEmployeeCreateModal } from '../components/PayrollEmployeeCreateModal';
import { PayrollEmployeeEditDrawer } from '../components/PayrollEmployeeEditDrawer';
import { PayrollExportMenu } from '../components/PayrollExportMenu';
import { PayrollFilterBar } from '../components/PayrollFilterBar';
import { PayrollApiError, exportEmployeeList } from '../api/payroll.client';
import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import type { EmployeeListExportQuery } from '../types/payroll-reports.types';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import { usePayrollExport } from '../hooks/usePayrollExport';
import { applyPayrollEmployeeCreateFinancialProfile } from '../utils/applyPayrollEmployeeCreateFinancialProfile';
import { applyPayrollEmployeeCreatePersonalData } from '../utils/applyPayrollEmployeeCreatePersonalData';
import {
  payrollEmployeeFormValuesToCreateInput,
  payrollEmployeeFormValuesToUpdateInput,
} from '../utils/payroll-employee-form-mappers';
import { sortPayrollEmployees } from '../utils/sortPayrollEmployees';
import styles from './PayrollEmployeesListScreen.module.scss';

const CONTRACT_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los contratos' },
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'OBRA', label: 'Obra o labor' },
  { value: 'PRESTACION', label: 'Prestación de servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
];

function toCreateInput(values: PayrollEmployeeFormValues): CreatePayrollEmployeeInput {
  return payrollEmployeeFormValuesToCreateInput(values);
}

function toUpdateInput(values: PayrollEmployeeFormValues): UpdatePayrollEmployeeInput {
  return payrollEmployeeFormValuesToUpdateInput(values);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrio un error inesperado.';
}

export function PayrollEmployeesListScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const readOnly = isPayrollReadOnlyRole(roleCode);

  const {
    state,
    setSearch,
    setStatusFilter,
    setLocationId,
    setContractType,
    setPositionId,
    setArea,
    setPage,
    queryFilters,
    exportFilters,
  } = usePayrollEmployeesFilters(8);
  const employeesQuery = usePayrollEmployeesQuery(queryFilters);
  const locationsQuery = useLocations();
  const positionsQuery = useEmployeePositions({ includeInactive: false });
  const { loading: exportLoading, exportReport } = usePayrollExport<EmployeeListExportQuery>({
    buildFilename: (format) =>
      `empleados-${new Date().toISOString().slice(0, 10)}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
    exportFn: (filters, format) => exportEmployeeList(filters, format, 'EMPLOYEES'),
  });
  const createEmployee = useCreatePayrollEmployeeMutation();
  const updateEmployee = useUpdatePayrollEmployeeMutation();
  const removeEmployee = useRemovePayrollEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PayrollEmployee | undefined>();
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<PayrollEmployee | undefined>();
  const [sortColumn, setSortColumn] = useState<EmpleadoSortColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<EmpleadoSortDirection>('asc');

  const employees = employeesQuery.data ?? [];

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data ?? [])
        .filter((location) => location.isActive !== false)
        .map((location) => ({ value: location.id, label: location.name })),
    [locationsQuery.data],
  );

  const positionOptions = useMemo(
    () =>
      (positionsQuery.data ?? [])
        .filter((position) => position.isActive)
        .map((position) => ({ value: position.id, label: position.title })),
    [positionsQuery.data],
  );

  const sortedEmployees = useMemo(
    () => sortPayrollEmployees(employees, sortColumn, sortDirection),
    [employees, sortColumn, sortDirection],
  );

  const handleSortColumn = (column: EmpleadoSortColumnKey) => {
    const next = toggleEmpleadoSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const totalCount = employees.length;
  const activeCount = employees.filter((employee) => employee.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const filteredCount = totalCount;

  const hasNextPage = employees.length >= state.pageSize;
  const totalPages = Math.max(1, hasNextPage ? state.page + 1 : state.page);
  const pageStart = filteredCount === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const pageEnd = Math.min(state.page * state.pageSize, filteredCount);

  const handleCreate = async (payload: PayrollEmployeeCreateWizardPayload) => {
    try {
      const employee = await createEmployee.mutateAsync(toCreateInput(payload.employee));
      await applyPayrollEmployeeCreatePersonalData(employee.userId, payload.employee);
      await applyPayrollEmployeeCreateFinancialProfile(employee.id, payload);
      toast.success('Empleado creado correctamente');
      setCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = async (payload: PayrollEmployeeCreateWizardPayload) => {
    if (!editingEmployee) return;

    try {
      await updateEmployee.mutateAsync({
        userId: editingEmployee.userId,
        input: toUpdateInput(payload.employee),
      });
      await applyPayrollEmployeeCreatePersonalData(editingEmployee.userId, payload.employee);
      await applyPayrollEmployeeCreateFinancialProfile(editingEmployee.id, payload);
      toast.success('Empleado actualizado');
      setEditingEmployee(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStatusChange = async () => {
    if (!statusChangeEmployee) return;

    try {
      if (statusChangeEmployee.isActive) {
        await removeEmployee.mutateAsync(statusChangeEmployee.userId);
        toast.success('Empleado desactivado');
      } else {
        await updateEmployee.mutateAsync({
          userId: statusChangeEmployee.userId,
          input: { isActive: true },
        });
        toast.success('Empleado activado');
      }
      setStatusChangeEmployee(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Empleados"
          subtitle={`Todos los empleados del tenant · ${activeCount} activos de ${totalCount}`}
          theme={empleadoTheme}
          primaryAction={
            readOnly ? undefined : (
              <EmpleadoActionButton theme={empleadoTheme} onClick={() => setCreateOpen(true)} />
            )
          }
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Total"
            value={totalCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Activos"
            value={activeCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Inactivos"
            value={inactiveCount}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Filtrados"
            value={filteredCount}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider variant="toolbar">
        {readOnly ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar empleados. Para crear, editar o desactivar registros,
            contacta a un administrador.
          </p>
        ) : null}
        <div className={styles.searchRow}>
          <EmpleadoListToolbar
            searchValue={state.search}
            statusFilter={state.statusFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            theme={empleadoTheme}
          />
        </div>
        <PayrollFilterBar>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede</span>
            <RecetaFilterSelect
              theme={empleadoTheme}
              size="md"
              value={state.locationId}
              options={[{ value: '', label: 'Todas las sedes' }, ...locationOptions]}
              onChange={setLocationId}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Contrato</span>
            <RecetaFilterSelect
              theme={empleadoTheme}
              size="md"
              value={state.contractType}
              options={CONTRACT_FILTER_OPTIONS}
              onChange={(value) => setContractType(value as typeof state.contractType)}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Cargo</span>
            <RecetaFilterSelect
              theme={empleadoTheme}
              size="md"
              value={state.positionId}
              options={[{ value: '', label: 'Todos los cargos' }, ...positionOptions]}
              onChange={setPositionId}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Área</span>
            <input
              className={styles.filterInput}
              value={state.area}
              placeholder="Filtrar por área"
              onChange={(event) => setArea(event.target.value)}
            />
          </div>
          <PayrollExportMenu
            theme={empleadoTheme}
            loading={exportLoading}
            disabled={employeesQuery.isLoading}
            onExport={(format) => void exportReport(exportFilters, format)}
          />
        </PayrollFilterBar>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {employeesQuery.isLoading ? (
          <LoadingState
            message="Cargando empleados…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="compact"
          />
        ) : null}

        {employeesQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudieron cargar empleados.</p>
            <button type="button" onClick={() => void employeesQuery.refetch()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0 ? (
          <div className={styles.state}>No hay empleados para los filtros seleccionados.</div>
        ) : null}

        {!employeesQuery.isLoading && !employeesQuery.isError && sortedEmployees.length > 0 ? (
          <EmpleadoTable
            theme={empleadoTheme}
            showActions
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
            pagination={{
              page: state.page,
              totalPages,
              summary: `${pageStart}-${pageEnd} de ${filteredCount}`,
              onPrevious: () => setPage(Math.max(1, state.page - 1)),
              onNext: () => setPage(state.page + 1),
            }}
          >
            {sortedEmployees.map((employee) => (
              <EmpleadoTableItem
                key={employee.id}
                id={employee.id}
                name={employee.name}
                email={employee.user?.email}
                cedula={employee.user?.cedula}
                position={employee.position}
                area={employee.area}
                contractType={employee.contractType}
                locationName={employee.location?.name ?? employee.locationId}
                hireDate={employee.hireDate}
                isActive={employee.isActive}
                theme={empleadoTheme}
                onView={() => navigate(`/payroll/employees/${employee.userId}/profile`)}
                onEdit={readOnly ? undefined : () => setEditingEmployee(employee)}
                onToggleStatus={readOnly ? undefined : () => setStatusChangeEmployee(employee)}
              />
            ))}
          </EmpleadoTable>
        ) : null}
      </EmpleadoPageSection>

      {!readOnly ? (
        <>
          <PayrollEmployeeCreateModal
            open={createOpen}
            submitting={createEmployee.isPending}
            theme={empleadoTheme}
            onClose={() => setCreateOpen(false)}
            onSubmit={(values) => void handleCreate(values)}
          />

          <PayrollEmployeeEditDrawer
            employee={editingEmployee}
            open={Boolean(editingEmployee)}
            submitting={updateEmployee.isPending}
            theme={empleadoTheme}
            onClose={() => setEditingEmployee(undefined)}
            onSubmit={(payload) => void handleEdit(payload)}
          />

          <PayrollDeactivateEmployeeDialog
            employee={statusChangeEmployee}
            open={Boolean(statusChangeEmployee)}
            submitting={removeEmployee.isPending || updateEmployee.isPending}
            theme={empleadoTheme}
            onCancel={() => setStatusChangeEmployee(undefined)}
            onConfirm={() => void handleStatusChange()}
          />
        </>
      ) : null}
    </EmpleadoPage>
  );
}
