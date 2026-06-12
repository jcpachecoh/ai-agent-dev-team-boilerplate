import { toast } from '@restopsiq/ui';
import { useMemo, useState } from 'react';

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
import { PayrollEmployeesFilters } from '../components/PayrollEmployeesFilters';
import { PayrollEmployeesTable } from '../components/PayrollEmployeesTable';
import { PayrollApiError } from '../api/payroll.client';
import styles from '../payroll.module.scss';

function toCreateInput(values: PayrollEmployeeFormValues): CreatePayrollEmployeeInput {
  return {
    cedula: values.cedula.trim(),
    documentType: values.documentType,
    email: values.email.trim(),
    password: values.password,
    roleId: values.roleId.trim(),
    locationId: values.locationId.trim(),
    name: values.name.trim(),
    position: values.position.trim(),
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
  };
}

function toUpdateInput(values: PayrollEmployeeFormValues): UpdatePayrollEmployeeInput {
  const base = toCreateInput(values);
  return {
    ...base,
    password: values.password.trim() || undefined,
  };
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
  const {
    state,
    setSearch,
    setLocationId,
    setContractType,
    setIncludeInactive,
    setPage,
    queryFilters,
  } = usePayrollEmployeesFilters();
  const employeesQuery = usePayrollEmployeesQuery(queryFilters);
  const createEmployee = useCreatePayrollEmployeeMutation();
  const updateEmployee = useUpdatePayrollEmployeeMutation();
  const removeEmployee = useRemovePayrollEmployeeMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<PayrollEmployee | undefined>();
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<PayrollEmployee | undefined>();

  const employees = employeesQuery.data ?? [];

  const filteredBySearch = useMemo(() => {
    const search = state.search.trim().toLowerCase();
    if (!search) return employees;

    return employees.filter((employee) => {
      const fullText = [employee.name, employee.user?.cedula, employee.user?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fullText.includes(search);
    });
  }, [employees, state.search]);

  const hasPreviousPage = state.page > 1;
  const hasNextPage = (employeesQuery.data?.length ?? 0) >= state.pageSize;

  const handleCreate = async (values: PayrollEmployeeFormValues) => {
    try {
      await createEmployee.mutateAsync(toCreateInput(values));
      toast.success('Empleado creado correctamente');
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
      toast.success('Empleado actualizado');
      setEditingEmployee(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingEmployee) return;

    try {
      await removeEmployee.mutateAsync(deactivatingEmployee.userId);
      toast.success('Empleado desactivado');
      setDeactivatingEmployee(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Nómina - Empleados</h1>
          <p className={styles.subtitle}>
            CRUD sobre employeeDetails (página {state.page}, resultados: {filteredBySearch.length})
          </p>
        </div>
        <button className={styles.button} onClick={() => setCreateOpen(true)}>
          Nuevo empleado
        </button>
      </header>

      <PayrollEmployeesFilters
        search={state.search}
        locationId={state.locationId}
        contractType={state.contractType}
        includeInactive={state.includeInactive}
        onSearchChange={setSearch}
        onLocationChange={setLocationId}
        onContractTypeChange={setContractType}
        onIncludeInactiveChange={setIncludeInactive}
      />

      {employeesQuery.isLoading ? <div className={styles.empty}>Cargando empleados...</div> : null}

      {employeesQuery.isError ? (
        <div className={styles.empty}>
          <p className={styles.error}>No se pudieron cargar empleados.</p>
          <button className={styles.buttonSecondary} onClick={() => void employeesQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!employeesQuery.isLoading && !employeesQuery.isError && filteredBySearch.length === 0 ? (
        <div className={styles.empty}>No hay empleados para los filtros seleccionados.</div>
      ) : null}

      {!employeesQuery.isLoading && !employeesQuery.isError && filteredBySearch.length > 0 ? (
        <PayrollEmployeesTable
          employees={filteredBySearch}
          onEdit={(employee) => setEditingEmployee(employee)}
          onDeactivate={(employee) => setDeactivatingEmployee(employee)}
        />
      ) : null}

      <footer className={styles.footer}>
        <button
          className={styles.buttonSecondary}
          disabled={!hasPreviousPage}
          onClick={() => setPage(Math.max(1, state.page - 1))}
        >
          Anterior
        </button>
        <span className={styles.subtitle}>Página {state.page}</span>
        <button
          className={styles.buttonSecondary}
          disabled={!hasNextPage}
          onClick={() => setPage(state.page + 1)}
        >
          Siguiente
        </button>
      </footer>

      <PayrollEmployeeCreateModal
        open={createOpen}
        submitting={createEmployee.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => void handleCreate(values)}
      />

      <PayrollEmployeeEditDrawer
        employee={editingEmployee}
        open={Boolean(editingEmployee)}
        submitting={updateEmployee.isPending}
        onClose={() => setEditingEmployee(undefined)}
        onSubmit={(values) => void handleEdit(values)}
      />

      <PayrollDeactivateEmployeeDialog
        employee={deactivatingEmployee}
        open={Boolean(deactivatingEmployee)}
        submitting={removeEmployee.isPending}
        onCancel={() => setDeactivatingEmployee(undefined)}
        onConfirm={() => void handleDeactivate()}
      />
    </div>
  );
}
