import { RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
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
import { EMPLOYEE_CATALOG_TYPES } from '../types/employee-catalog.types';
import {
  buildCatalogSelectOptions,
  catalogSelectPlaceholder,
  useEmployeeCatalogsGrouped,
} from '../hooks/useEmployeeCatalogOptions';
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

const REQUIRED_CATALOG_FIELDS: Array<{
  key: keyof Pick<
    PayrollEmployeeFormValues,
    | 'area'
    | 'department'
    | 'epsName'
    | 'pensionFundName'
    | 'cesantiasFundName'
    | 'arlName'
    | 'cajaCompensacion'
  >;
  label: string;
}> = [
  { key: 'area', label: 'Área' },
  { key: 'department', label: 'Departamento' },
  { key: 'epsName', label: 'EPS' },
  { key: 'pensionFundName', label: 'Fondo de pensión' },
  { key: 'cesantiasFundName', label: 'Fondo de cesantías' },
  { key: 'arlName', label: 'ARL' },
  { key: 'cajaCompensacion', label: 'Caja de compensación' },
];

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

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

const CONTRACT_TYPE_OPTIONS: Array<{ value: EmployeeContractType; label: string }> = [
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'OBRA', label: 'Obra o labor' },
  { value: 'PRESTACION', label: 'Prestación de servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
];

const SALARY_TYPE_OPTIONS: Array<{ value: SalaryType; label: string }> = [
  { value: 'ORDINARIO', label: 'Ordinario' },
  { value: 'INTEGRAL', label: 'Integral' },
];

const ARL_LEVEL_OPTIONS: Array<{ value: ArlRiskLevel; label: string }> = [
  { value: 'RIESGO_I', label: 'Riesgo I' },
  { value: 'RIESGO_II', label: 'Riesgo II' },
  { value: 'RIESGO_III', label: 'Riesgo III' },
  { value: 'RIESGO_IV', label: 'Riesgo IV' },
  { value: 'RIESGO_V', label: 'Riesgo V' },
];

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
  const catalogsQuery = useEmployeeCatalogsGrouped();
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

  const areaSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.AREA] ?? [],
        values.area,
      ),
    [catalogsQuery.grouped, values.area],
  );

  const departmentSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.DEPARTMENT] ?? [],
        values.department,
      ),
    [catalogsQuery.grouped, values.department],
  );

  const epsSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.EPS] ?? [],
        values.epsName,
      ),
    [catalogsQuery.grouped, values.epsName],
  );

  const pensionSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.PENSION_FUND] ?? [],
        values.pensionFundName,
      ),
    [catalogsQuery.grouped, values.pensionFundName],
  );

  const cesantiasSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.CESANTIAS_FUND] ?? [],
        values.cesantiasFundName,
      ),
    [catalogsQuery.grouped, values.cesantiasFundName],
  );

  const arlSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.ARL] ?? [],
        values.arlName,
      ),
    [catalogsQuery.grouped, values.arlName],
  );

  const cajaSelectOptions = useMemo(
    () =>
      buildCatalogSelectOptions(
        catalogsQuery.grouped[EMPLOYEE_CATALOG_TYPES.CAJA_COMPENSACION] ?? [],
        values.cajaCompensacion,
      ),
    [catalogsQuery.grouped, values.cajaCompensacion],
  );

  useEffect(() => {
    setValues(initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES);
    setError(null);
  }, [initialValues, mode]);

  const update = (patch: Partial<PayrollEmployeeFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim() || !values.email.trim() || !values.cedula.trim()) {
      setError('Nombre, correo y cédula son obligatorios.');
      return;
    }

    if (!values.locationId.trim() || !values.roleId.trim()) {
      setError('Sede y rol son obligatorios.');
      return;
    }

    const salary = Number(values.salaryAmount);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError('El salario debe ser un número mayor que 0.');
      return;
    }

    const missingCatalogField = REQUIRED_CATALOG_FIELDS.find((field) => !values[field.key].trim());
    if (missingCatalogField) {
      setError(`${missingCatalogField.label} es obligatorio.`);
      return;
    }

    setError(null);
    onSubmit(values);
  };

  const catalogsLoading = catalogsQuery.isLoading;
  const catalogsError = catalogsQuery.isError;

  const catalogPlaceholder = (hasOptions: boolean) =>
    catalogSelectPlaceholder(
      catalogsLoading,
      hasOptions,
      undefined,
      undefined,
      undefined,
      catalogsError,
    );

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.modalBody}>
        {catalogsError ? (
          <p className={styles.error}>
            No se pudieron cargar los catálogos. Recarga la página e intenta de nuevo.
          </p>
        ) : null}
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de documento</span>
            <RecetaFilterSelect
              aria-label="Tipo de documento"
              options={DOCUMENT_TYPE_OPTIONS}
              value={values.documentType}
              onChange={(value) => update({ documentType: value as DocumentType })}
              theme={theme}
              size="md"
            />
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cédula *</span>
            <input
              aria-label="Cédula"
              className={styles.input}
              value={values.cedula}
              onChange={(event) => update({ cedula: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Correo *</span>
            <input
              aria-label="Correo"
              className={styles.input}
              type="email"
              value={values.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <input
              aria-label="Nombre"
              className={styles.input}
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
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
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Área *</span>
            <RecetaFilterSelect
              aria-label="Área"
              options={areaSelectOptions}
              value={values.area}
              disabled={catalogsLoading || areaSelectOptions.length === 0}
              placeholder={catalogPlaceholder(areaSelectOptions.length > 0)}
              onChange={(value) => update({ area: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Departamento *</span>
            <RecetaFilterSelect
              aria-label="Departamento"
              options={departmentSelectOptions}
              value={values.department}
              disabled={catalogsLoading || departmentSelectOptions.length === 0}
              placeholder={catalogPlaceholder(departmentSelectOptions.length > 0)}
              onChange={(value) => update({ department: value })}
              theme={theme}
              size="md"
            />
          </div>
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
            <span className={styles.fieldLabel}>Fecha de ingreso</span>
            <input
              className={styles.input}
              type="date"
              value={values.hireDate}
              onChange={(event) => update({ hireDate: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Inicio de contrato</span>
            <input
              className={styles.input}
              type="date"
              value={values.contractStart}
              onChange={(event) => update({ contractStart: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fin de contrato</span>
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
          <div className={styles.field}>
            <span className={styles.fieldLabel}>EPS *</span>
            <RecetaFilterSelect
              aria-label="EPS"
              options={epsSelectOptions}
              value={values.epsName}
              disabled={catalogsLoading || epsSelectOptions.length === 0}
              placeholder={catalogPlaceholder(epsSelectOptions.length > 0)}
              onChange={(value) => update({ epsName: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Fondo de pensión *</span>
            <RecetaFilterSelect
              aria-label="Fondo de pensión"
              options={pensionSelectOptions}
              value={values.pensionFundName}
              disabled={catalogsLoading || pensionSelectOptions.length === 0}
              placeholder={catalogPlaceholder(pensionSelectOptions.length > 0)}
              onChange={(value) => update({ pensionFundName: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Fondo de cesantías *</span>
            <RecetaFilterSelect
              aria-label="Fondo de cesantías"
              options={cesantiasSelectOptions}
              value={values.cesantiasFundName}
              disabled={catalogsLoading || cesantiasSelectOptions.length === 0}
              placeholder={catalogPlaceholder(cesantiasSelectOptions.length > 0)}
              onChange={(value) => update({ cesantiasFundName: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>ARL *</span>
            <RecetaFilterSelect
              aria-label="ARL"
              options={arlSelectOptions}
              value={values.arlName}
              disabled={catalogsLoading || arlSelectOptions.length === 0}
              placeholder={catalogPlaceholder(arlSelectOptions.length > 0)}
              onChange={(value) => update({ arlName: value })}
              theme={theme}
              size="md"
            />
          </div>
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
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Caja de compensación *</span>
            <RecetaFilterSelect
              aria-label="Caja de compensación"
              options={cajaSelectOptions}
              value={values.cajaCompensacion}
              disabled={catalogsLoading || cajaSelectOptions.length === 0}
              placeholder={catalogPlaceholder(cajaSelectOptions.length > 0)}
              onChange={(value) => update({ cajaCompensacion: value })}
              theme={theme}
              size="md"
            />
          </div>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <p className={styles.formHint}>
          Los campos con * son obligatorios para crear y actualizar.
        </p>
      </div>
      <footer className={styles.modalFooter}>
        <RecetaFormButton
          variant="cancel"
          label="Cancelar"
          type="button"
          theme={theme}
          onClick={onCancel}
          disabled={submitting}
        />
        <RecetaFormButton
          variant="save"
          label={submitting ? 'Guardando...' : labelForMode(mode)}
          type="submit"
          theme={theme}
          disabled={submitting}
        />
      </footer>
    </form>
  );
}
