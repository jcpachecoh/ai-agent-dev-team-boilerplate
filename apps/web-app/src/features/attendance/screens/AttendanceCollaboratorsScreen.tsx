import {
  EmpleadoActionButton,
  EmpleadoListToolbar,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  EmpleadoTable,
  EmpleadoTableItem,
  RecetaFilterSelect,
  RecetaMetricCard,
  toast,
  toggleEmpleadoSort,
  type EmpleadoSortColumnKey,
  type EmpleadoSortDirection,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { isPayrollReadOnlyRole } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';
import { PayrollDeactivateEmployeeDialog } from '@/features/payroll/components/PayrollDeactivateEmployeeDialog';
import { PayrollEmployeeCreateModal } from '@/features/payroll/components/PayrollEmployeeCreateModal';
import { PayrollEmployeeEditDrawer } from '@/features/payroll/components/PayrollEmployeeEditDrawer';
import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import {
  useCreatePayrollEmployeeMutation,
  useRemovePayrollEmployeeMutation,
  useUpdatePayrollEmployeeMutation,
} from '@/features/payroll/hooks/usePayrollEmployeeMutations';
import type {
  CreatePayrollEmployeeInput,
  PayrollEmployee,
  PayrollEmployeeFormValues,
  UpdatePayrollEmployeeInput,
} from '@/features/payroll/types/payroll.types';
import { sortPayrollEmployees } from '@/features/payroll/utils/sortPayrollEmployees';

import { useAttendanceCollaboratorsEmployeesQuery } from '../hooks/useAttendanceCollaboratorsEmployeesQuery';
import { useAttendanceCollaboratorsFilters } from '../hooks/useAttendanceCollaboratorsFilters';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import { useLaborClassificationFilter } from '../stores/attendance-labor-filter.store';
import { matchesLaborClassificationFilter } from '../utils/labor-classification';
import styles from './AttendanceCollaboratorsScreen.module.scss';

const CONTRACT_OPTIONS = [
  { value: 'all', label: 'Todos los contratos' },
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'OBRA', label: 'Obra o labor' },
  { value: 'PRESTACION', label: 'Prestación de servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
];

function toCreateInput(values: PayrollEmployeeFormValues): CreatePayrollEmployeeInput {
  return {
    cedula: values.cedula.trim(),
    documentType: values.documentType,
    email: values.email.trim(),
    roleId: values.roleId.trim(),
    locationId: values.locationId.trim(),
    name: values.name.trim(),
    positionId: values.positionId.trim(),
    area: values.area.trim(),
    department: values.department.trim(),
    contractType: values.contractType,
    hireDate: values.hireDate,
    contractStart: values.contractStart,
    contractEnd: values.contractEnd.trim() || undefined,
    salaryType: values.salaryType,
    salaryAmount: Number(values.salaryAmount),
    epsName: values.epsName.trim(),
    pensionFundName: values.pensionFundName.trim(),
    cesantiasFundName: values.cesantiasFundName.trim(),
    arlName: values.arlName.trim(),
    arlRiskLevel: values.arlRiskLevel,
    cajaCompensacion: values.cajaCompensacion.trim(),
    costCenter: values.costCenter,
    laborClassification: values.laborClassification,
    barrio: values.barrio.trim() || undefined,
    localidad: values.localidad.trim() || undefined,
    nonSalaryAmount:
      values.nonSalaryAmount.trim() !== '' ? Number(values.nonSalaryAmount) : undefined,
    beneficiaries: values.beneficiaries.map((b) => ({
      fullName: b.fullName.trim(),
      relationshipType: b.relationshipType,
      age: Number(b.age),
    })),
  };
}

function toUpdateInput(values: PayrollEmployeeFormValues): UpdatePayrollEmployeeInput {
  return toCreateInput(values);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export function AttendanceCollaboratorsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const readOnly = isPayrollReadOnlyRole(roleCode);
  const { value: laborFilter } = useLaborClassificationFilter();
  const { locations: scopedLocations } = useAttendanceScopeLocations();

  const { state, setSearch, setArea, setContractType, setLocationId, setStatusFilter, setPage } =
    useAttendanceCollaboratorsFilters(8);
  const employeesQuery = useAttendanceCollaboratorsEmployeesQuery();
  const createEmployee = useCreatePayrollEmployeeMutation();
  const updateEmployee = useUpdatePayrollEmployeeMutation();
  const removeEmployee = useRemovePayrollEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PayrollEmployee | undefined>();
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<PayrollEmployee | undefined>();
  const [sortColumn, setSortColumn] = useState<EmpleadoSortColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<EmpleadoSortDirection>('asc');

  const scopedLocationIds = useMemo(
    () => new Set(scopedLocations.map((location) => location.id)),
    [scopedLocations],
  );

  const scopedEmployees = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    if (scopedLocationIds.size === 0) return employees;
    return employees.filter((employee) => scopedLocationIds.has(employee.locationId));
  }, [employeesQuery.data, scopedLocationIds]);

  const areaOptions = useMemo(() => {
    const values = [
      ...new Set(scopedEmployees.map((employee) => employee.area).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right, 'es'));
    return [
      { value: 'all', label: 'Todas las áreas' },
      ...values.map((value) => ({ value, label: value })),
    ];
  }, [scopedEmployees]);

  const locationOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const location of scopedLocations) {
      byId.set(location.id, location.name);
    }
    for (const employee of scopedEmployees) {
      if (!byId.has(employee.locationId)) {
        byId.set(employee.locationId, employee.location?.name ?? employee.locationId);
      }
    }
    return [
      { value: 'all', label: 'Todas las sedes' },
      ...[...byId.entries()]
        .sort((left, right) => left[1].localeCompare(right[1], 'es'))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [scopedEmployees, scopedLocations]);

  const employeesBeforeLaborFilter = useMemo(() => {
    const search = state.search.trim().toLowerCase();

    return scopedEmployees.filter((employee) => {
      const matchesSearch =
        !search ||
        [employee.name, employee.user?.cedula, employee.user?.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        state.statusFilter === 'all' ||
        (state.statusFilter === 'active' && employee.isActive) ||
        (state.statusFilter === 'inactive' && !employee.isActive);

      const matchesArea = state.area === 'all' || employee.area === state.area;
      const matchesContract =
        state.contractType === 'all' || employee.contractType === state.contractType;
      const matchesLocation =
        state.locationId === 'all' || employee.locationId === state.locationId;

      return matchesSearch && matchesStatus && matchesArea && matchesContract && matchesLocation;
    });
  }, [
    scopedEmployees,
    state.area,
    state.contractType,
    state.locationId,
    state.search,
    state.statusFilter,
  ]);

  const filteredEmployees = useMemo(
    () =>
      employeesBeforeLaborFilter.filter((employee) =>
        matchesLaborClassificationFilter(employee, laborFilter),
      ),
    [employeesBeforeLaborFilter, laborFilter],
  );

  const sortedEmployees = useMemo(
    () => sortPayrollEmployees(filteredEmployees, sortColumn, sortDirection),
    [filteredEmployees, sortColumn, sortDirection],
  );

  const pagedEmployees = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    return sortedEmployees.slice(start, start + state.pageSize);
  }, [sortedEmployees, state.page, state.pageSize]);

  const handleSortColumn = (column: EmpleadoSortColumnKey) => {
    const next = toggleEmpleadoSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const totalCount = filteredEmployees.length;
  const activeCount = filteredEmployees.filter((employee) => employee.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const filteredCount = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / state.pageSize));
  const pageStart = filteredCount === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const pageEnd = Math.min(state.page * state.pageSize, filteredCount);

  const handleCreate = async (values: PayrollEmployeeFormValues) => {
    try {
      await createEmployee.mutateAsync(toCreateInput(values));
      toast.success('Colaborador creado correctamente');
      setCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = async (values: PayrollEmployeeFormValues) => {
    if (!editingEmployee) return;

    try {
      await updateEmployee.mutateAsync({
        userId: editingEmployee.userId,
        input: toUpdateInput(values),
      });
      toast.success('Colaborador actualizado');
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
        toast.success('Colaborador desactivado');
      } else {
        await updateEmployee.mutateAsync({
          userId: statusChangeEmployee.userId,
          input: { isActive: true },
        });
        toast.success('Colaborador activado');
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
          title="Colaboradores"
          subtitle={`Clasificación, sede y contrato · ${activeCount} activos de ${totalCount}`}
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
            title="Alcance sede"
            value={scopedEmployees.length}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider variant="toolbar">
        {readOnly ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar colaboradores. Para crear, editar o desactivar registros,
            contacta a un administrador.
          </p>
        ) : null}
        <EmpleadoListToolbar
          searchValue={state.search}
          statusFilter={state.statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          theme={empleadoTheme}
        />
        <div className={styles.toolbarFilters}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Área</span>
            <RecetaFilterSelect
              aria-label="Filtrar por área"
              options={areaOptions}
              value={state.area}
              onChange={setArea}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contrato</span>
            <RecetaFilterSelect
              aria-label="Filtrar por tipo de contrato"
              options={CONTRACT_OPTIONS}
              value={state.contractType}
              onChange={(value) => setContractType(value as typeof state.contractType)}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sede</span>
            <RecetaFilterSelect
              aria-label="Filtrar por sede"
              options={locationOptions}
              value={state.locationId}
              onChange={setLocationId}
              theme={empleadoTheme}
              size="md"
            />
          </label>
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        {employeesQuery.isLoading ? (
          <div className={styles.state}>Cargando colaboradores...</div>
        ) : null}

        {employeesQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudieron cargar colaboradores.</p>
            <button type="button" onClick={() => void employeesQuery.refetch()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!employeesQuery.isLoading && !employeesQuery.isError && filteredEmployees.length === 0 ? (
          <div className={styles.state}>No hay colaboradores para los filtros seleccionados.</div>
        ) : null}

        {!employeesQuery.isLoading && !employeesQuery.isError && pagedEmployees.length > 0 ? (
          <EmpleadoTable
            theme={empleadoTheme}
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
            {pagedEmployees.map((employee) => (
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
                showActions={!readOnly}
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
            onSubmit={(values) => void handleEdit(values)}
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
