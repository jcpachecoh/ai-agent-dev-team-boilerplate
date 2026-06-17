import { RecetaFilterSelect } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useAdminRolesForSelect } from '@/features/usuarios/hooks/useAdminUsers';
import type { AdminRoleOptionApi } from '@/features/usuarios/types';

import {
  type ArlRiskLevel,
  type DocumentType,
  type EmployeeContractType,
  type PayrollEmployee,
  type PayrollEmployeeFormValues,
  type SalaryType,
} from '../types/payroll.types';
import styles from '../payroll.module.scss';

export interface PayrollEmployeeFormProps {
  mode: 'create' | 'edit';
  initialValues?: PayrollEmployee;
  locations?: Array<{ id: string; name: string; isActive?: boolean }>;
  roles?: AdminRoleOptionApi[];
  onCancel: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
  submitting?: boolean;
}

const EMPTY_VALUES: PayrollEmployeeFormValues = {
  cedula: '',
  documentType: 'CC',
  email: '',
  password: '',
  roleId: '',
  locationId: '',
  name: '',
  position: '',
  area: '',
  department: '',
  contractType: 'INDEFINIDO',
  hireDate: '',
  contractStart: '',
  contractEnd: '',
  salaryType: 'ORDINARIO',
  salaryAmount: '',
  epsName: '',
  pensionFundName: '',
  cesantiasFundName: '',
  arlName: '',
  arlRiskLevel: 'RIESGO_I',
  cajaCompensacion: '',
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function employeeToFormValues(employee: PayrollEmployee): PayrollEmployeeFormValues {
  return {
    cedula: employee.user?.cedula ?? '',
    documentType: (employee.user?.documentType as DocumentType) ?? 'CC',
    email: employee.user?.email ?? '',
    password: '',
    roleId: employee.user?.roleId ?? '',
    locationId: employee.locationId,
    name: employee.name,
    position: employee.position,
    area: employee.area,
    department: employee.department,
    contractType: employee.contractType,
    hireDate: toDateInputValue(employee.hireDate),
    contractStart: toDateInputValue(employee.contractStart),
    contractEnd: toDateInputValue(employee.contractEnd),
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    epsName: employee.epsName,
    pensionFundName: employee.pensionFundName,
    cesantiasFundName: employee.cesantiasFundName,
    arlName: employee.arlName,
    arlRiskLevel: employee.arlRiskLevel,
    cajaCompensacion: employee.cajaCompensacion,
  };
}

function labelForMode(mode: 'create' | 'edit'): string {
  return mode === 'create' ? 'Crear empleado' : 'Guardar cambios';
}

const CONTRACT_TYPES: EmployeeContractType[] = [
  'FIJO',
  'INDEFINIDO',
  'OBRA',
  'PRESTACION',
  'APRENDIZAJE',
];
const DOCUMENT_TYPES: DocumentType[] = ['CC', 'CE', 'NIT', 'PASSPORT'];
const SALARY_TYPES: SalaryType[] = ['ORDINARIO', 'INTEGRAL'];
const ARL_LEVELS: ArlRiskLevel[] = ['RIESGO_I', 'RIESGO_II', 'RIESGO_III', 'RIESGO_IV', 'RIESGO_V'];

function toSelectOptions(values: readonly string[]): Array<{ value: string; label: string }> {
  return values.map((value) => ({ value, label: value }));
}

const DOCUMENT_TYPE_OPTIONS = toSelectOptions(DOCUMENT_TYPES);
const CONTRACT_TYPE_OPTIONS = toSelectOptions(CONTRACT_TYPES);
const SALARY_TYPE_OPTIONS = toSelectOptions(SALARY_TYPES);
const ARL_LEVEL_OPTIONS = toSelectOptions(ARL_LEVELS);

export function PayrollEmployeeForm({
  mode,
  initialValues,
  locations,
  roles,
  onCancel,
  onSubmit,
  submitting = false,
}: PayrollEmployeeFormProps): React.JSX.Element {
  const theme = useUiTheme();
  const locationsQuery = useLocations();
  const rolesQuery = useAdminRolesForSelect();
  const locationRows = locations ?? locationsQuery.data ?? [];
  const roleRows = roles ?? rolesQuery.data ?? [];
  const [values, setValues] = useState<PayrollEmployeeFormValues>(
    initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES,
  );
  const [error, setError] = useState<string | null>(null);

  const locationOptions = useMemo(() => {
    const options = locationRows
      .filter((location) => location.isActive !== false)
      .map((location) => ({ id: location.id, name: location.name }));

    if (
      values.locationId &&
      initialValues?.location?.name &&
      !options.some((option) => option.id === values.locationId)
    ) {
      options.unshift({
        id: values.locationId,
        name: initialValues.location.name,
      });
    }

    return options;
  }, [initialValues?.location?.name, locationRows, values.locationId]);

  const selectedLocationName =
    locationOptions.find((option) => option.id === values.locationId)?.name ?? null;

  const roleOptions = useMemo(() => {
    const options = roleRows
      .filter((role) => role.isActive)
      .map((role) => ({ id: role.id, name: role.name, code: role.code }));

    if (values.roleId && !options.some((option) => option.id === values.roleId)) {
      const currentRole = roleRows.find((role) => role.id === values.roleId);
      if (currentRole) {
        options.unshift({
          id: currentRole.id,
          name: currentRole.name,
          code: currentRole.code,
        });
      }
    }

    return options;
  }, [roleRows, values.roleId]);

  const locationSelectOptions = useMemo(
    () => locationOptions.map((location) => ({ value: location.id, label: location.name })),
    [locationOptions],
  );

  const roleSelectOptions = useMemo(
    () => roleOptions.map((role) => ({ value: role.id, label: role.name })),
    [roleOptions],
  );

  const selectedRoleName = roleOptions.find((option) => option.id === values.roleId)?.name ?? null;

  useEffect(() => {
    setValues(initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES);
    setError(null);
    // #region agent log
    if (initialValues) {
      const mapped = employeeToFormValues(initialValues);
      fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0046ac' },
        body: JSON.stringify({
          sessionId: '0046ac',
          runId: 'post-fix',
          hypothesisId: 'A-B',
          location: 'PayrollEmployeeForm.tsx:useEffect',
          message: 'Form initialValues mapped',
          data: {
            mode,
            apiLocationId: initialValues.locationId,
            apiLocationName: initialValues.location?.name ?? null,
            formLocationId: mapped.locationId,
            selectedLocationName,
            apiRoleId: initialValues.user?.roleId ?? null,
            formRoleId: mapped.roleId,
            selectedRoleName,
            roleOptionsCount: roleOptions.length,
            locationOptionsCount: locationOptions.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  }, [initialValues, mode]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0046ac' },
      body: JSON.stringify({
        sessionId: '0046ac',
        runId: 'post-fix-role',
        hypothesisId: 'role-select',
        location: 'PayrollEmployeeForm.tsx:selects',
        message: 'Role and location select state',
        data: {
          roleId: values.roleId,
          selectedRoleName,
          roleOptionsCount: roleOptions.length,
          rolesLoading: rolesQuery.isLoading && !roles,
          locationId: values.locationId,
          selectedLocationName,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [
    roleOptions.length,
    rolesQuery.isLoading,
    roles,
    selectedLocationName,
    selectedRoleName,
    values.locationId,
    values.roleId,
  ]);

  const update = (patch: Partial<PayrollEmployeeFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim() || !values.email.trim() || !values.cedula.trim()) {
      setError('Nombre, email y cedula son obligatorios.');
      return;
    }

    if (!values.locationId.trim() || !values.roleId.trim()) {
      setError('Sede y rol son obligatorios.');
      return;
    }

    if (mode === 'create' && !values.password.trim()) {
      setError('La contrasena es obligatoria para crear.');
      return;
    }

    const salary = Number(values.salaryAmount);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError('El salario debe ser un numero mayor que 0.');
      return;
    }

    setError(null);
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.modalBody}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <input
              aria-label="Nombre"
              className={styles.input}
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cedula *</span>
            <input
              aria-label="Cedula"
              className={styles.input}
              value={values.cedula}
              onChange={(event) => update({ cedula: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email *</span>
            <input
              aria-label="Email"
              className={styles.input}
              type="email"
              value={values.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contrasena {mode === 'create' ? '*' : ''}</span>
            <input
              aria-label="Contrasena"
              className={styles.input}
              type="password"
              value={values.password}
              onChange={(event) => update({ password: event.target.value })}
              placeholder={mode === 'edit' ? 'Opcional al editar' : ''}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Document Type</span>
            <RecetaFilterSelect
              aria-label="Document Type"
              options={DOCUMENT_TYPE_OPTIONS}
              value={values.documentType}
              onChange={(value) => update({ documentType: value as DocumentType })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rol *</span>
            <RecetaFilterSelect
              aria-label="Rol"
              options={roleSelectOptions}
              value={values.roleId}
              disabled={rolesQuery.isLoading && !roles}
              placeholder={rolesQuery.isLoading && !roles ? 'Cargando roles...' : 'Seleccionar rol'}
              onChange={(value) => update({ roleId: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Sede *</span>
            <RecetaFilterSelect
              aria-label="Sede"
              options={locationSelectOptions}
              value={values.locationId}
              disabled={locationsQuery.isLoading && !locations}
              placeholder={
                locationsQuery.isLoading && !locations ? 'Cargando sedes...' : 'Seleccionar sede'
              }
              onChange={(value) => update({ locationId: value })}
              theme={theme}
              size="md"
            />
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cargo</span>
            <input
              className={styles.input}
              value={values.position}
              onChange={(event) => update({ position: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Area</span>
            <input
              className={styles.input}
              value={values.area}
              onChange={(event) => update({ area: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Departamento</span>
            <input
              className={styles.input}
              value={values.department}
              onChange={(event) => update({ department: event.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de contrato</span>
            <RecetaFilterSelect
              aria-label="Tipo de contrato"
              options={CONTRACT_TYPE_OPTIONS}
              value={values.contractType}
              onChange={(value) => update({ contractType: value as EmployeeContractType })}
              theme={theme}
              size="md"
            />
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fecha ingreso</span>
            <input
              className={styles.input}
              type="date"
              value={values.hireDate}
              onChange={(event) => update({ hireDate: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Inicio contrato</span>
            <input
              className={styles.input}
              type="date"
              value={values.contractStart}
              onChange={(event) => update({ contractStart: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fin contrato</span>
            <input
              className={styles.input}
              type="date"
              value={values.contractEnd}
              onChange={(event) => update({ contractEnd: event.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de salario</span>
            <RecetaFilterSelect
              aria-label="Tipo de salario"
              options={SALARY_TYPE_OPTIONS}
              value={values.salaryType}
              onChange={(value) => update({ salaryType: value as SalaryType })}
              theme={theme}
              size="md"
            />
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Salario</span>
            <input
              aria-label="Salario"
              className={styles.input}
              type="number"
              min="0"
              value={values.salaryAmount}
              onChange={(event) => update({ salaryAmount: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>EPS</span>
            <input
              className={styles.input}
              value={values.epsName}
              onChange={(event) => update({ epsName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fondo pension</span>
            <input
              className={styles.input}
              value={values.pensionFundName}
              onChange={(event) => update({ pensionFundName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cesantias</span>
            <input
              className={styles.input}
              value={values.cesantiasFundName}
              onChange={(event) => update({ cesantiasFundName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>ARL</span>
            <input
              className={styles.input}
              value={values.arlName}
              onChange={(event) => update({ arlName: event.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Nivel ARL</span>
            <RecetaFilterSelect
              aria-label="Nivel ARL"
              options={ARL_LEVEL_OPTIONS}
              value={values.arlRiskLevel}
              onChange={(value) => update({ arlRiskLevel: value as ArlRiskLevel })}
              theme={theme}
              size="md"
            />
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Caja compensacion</span>
            <input
              className={styles.input}
              value={values.cajaCompensacion}
              onChange={(event) => update({ cajaCompensacion: event.target.value })}
            />
          </label>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <p className={styles.formHint}>
          Los campos con * son obligatorios para crear y actualizar.
        </p>
      </div>
      <footer className={styles.modalFooter}>
        <button className={styles.buttonSecondary} type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : labelForMode(mode)}
        </button>
      </footer>
    </form>
  );
}
