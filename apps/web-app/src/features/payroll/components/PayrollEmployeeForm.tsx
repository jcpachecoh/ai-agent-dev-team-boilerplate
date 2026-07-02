import { RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useAdminRolesForSelect } from '@/features/usuarios/hooks/useAdminUsers';
import type { AdminRoleOptionApi } from '@/features/usuarios/types';

import {
  type ArlRiskLevel,
  type BeneficiaryFormRow,
  type BeneficiaryRelationshipType,
  type CostCenter,
  type DocumentType,
  type EmployeeContractType,
  type LaborClassification,
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
import { useEmployeePositions } from '../hooks/useEmployeePositions';
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

const EMPTY_BENEFICIARY: BeneficiaryFormRow = { relationshipType: 'CHILD', fullName: '', age: '' };

const EMPTY_VALUES: PayrollEmployeeFormValues = {
  cedula: '',
  documentType: 'CC',
  email: '',
  roleId: '',
  locationId: '',
  name: '',
  positionId: '',
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
  barrio: '',
  localidad: '',
  costCenter: 'OPERACIONES',
  laborClassification: 'ADMINISTRATIVO',
  nonSalaryAmount: '',
  beneficiaries: [],
};

const REQUIRED_CATALOG_FIELDS: Array<{
  key: keyof Pick<
    PayrollEmployeeFormValues,
    | 'department'
    | 'epsName'
    | 'pensionFundName'
    | 'cesantiasFundName'
    | 'arlName'
    | 'cajaCompensacion'
  >;
  label: string;
}> = [
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
    positionId: employee.positionId ?? '',
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
    barrio: employee.barrio ?? '',
    localidad: employee.localidad ?? '',
    costCenter: (employee.costCenter as CostCenter) ?? 'OPERACIONES',
    laborClassification: (employee.laborClassification as LaborClassification) ?? 'ADMINISTRATIVO',
    nonSalaryAmount: employee.nonSalaryAmount ?? '',
    beneficiaries: (employee.beneficiaries ?? []).map((b) => ({
      relationshipType: b.relationshipType as BeneficiaryRelationshipType,
      fullName: b.fullName,
      age: String(b.age),
    })),
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

const COST_CENTER_OPTIONS: Array<{ value: CostCenter; label: string }> = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'OPERACIONES', label: 'Operaciones' },
  { value: 'PLANTA', label: 'Planta' },
  { value: 'GERENCIA', label: 'Gerencia' },
  { value: 'INCAPACIDADES', label: 'Incapacidades' },
];

const LABOR_CLASSIFICATION_OPTIONS: Array<{ value: LaborClassification; label: string }> = [
  { value: 'COCINA', label: 'Cocina' },
  { value: 'SERVICIO', label: 'Servicio' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

const BENEFICIARY_TYPE_OPTIONS: Array<{ value: BeneficiaryRelationshipType; label: string }> = [
  { value: 'CHILD', label: 'Hijo' },
  { value: 'SPOUSE', label: 'Cónyuge' },
  { value: 'TUTOR', label: 'Tutor' },
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
  const positionsQuery = useEmployeePositions({ includeInactive: false });
  const locationRows = locations ?? locationsQuery.data ?? [];
  const roleRows = roles ?? rolesQuery.data ?? [];
  const [values, setValues] = useState<PayrollEmployeeFormValues>(
    initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES,
  );
  const [error, setError] = useState<string | null>(null);

  const hasActivePositions = (positionsQuery.data ?? []).some((p) => p.isActive);

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

  const positionSelectOptions = useMemo(() => {
    const options = (positionsQuery.data ?? [])
      .filter((position) => position.isActive)
      .map((position) => ({
        value: position.id,
        label: `${position.title} — ${position.area}`,
      }));

    if (values.positionId && !options.some((option) => option.value === values.positionId)) {
      const current = positionsQuery.data?.find((position) => position.id === values.positionId);
      if (current) {
        options.unshift({
          value: current.id,
          label: `${current.title} — ${current.area}`,
        });
      }
    }

    return options;
  }, [positionsQuery.data, values.positionId]);

  const selectedPosition = useMemo(
    () => (positionsQuery.data ?? []).find((position) => position.id === values.positionId),
    [positionsQuery.data, values.positionId],
  );

  useEffect(() => {
    setValues(initialValues ? employeeToFormValues(initialValues) : EMPTY_VALUES);
    setError(null);
  }, [initialValues, mode]);

  const update = (patch: Partial<PayrollEmployeeFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const updateBeneficiary = (index: number, patch: Partial<BeneficiaryFormRow>) => {
    setValues((prev) => {
      const next = [...prev.beneficiaries];
      next[index] = { ...next[index], ...patch };
      return { ...prev, beneficiaries: next };
    });
  };

  const addBeneficiary = () =>
    setValues((prev) => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { ...EMPTY_BENEFICIARY }],
    }));

  const removeBeneficiary = (index: number) =>
    setValues((prev) => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter((_, i) => i !== index),
    }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim() || !values.email.trim() || !values.cedula.trim()) {
      setError('Nombre, correo y cédula son obligatorios.');
      return;
    }

    if (!values.locationId.trim() || !values.roleId.trim()) {
      setError('Áreas y rol del sistema son obligatorios.');
      return;
    }

    if (!values.costCenter) {
      setError('Centro de Costos es obligatorio.');
      return;
    }

    if (!values.laborClassification) {
      setError('Clasificación mano de obra es obligatoria.');
      return;
    }

    if (hasActivePositions && !values.positionId.trim()) {
      setError('Cargo es obligatorio.');
      return;
    }

    if (hasActivePositions) {
      const areaFromPosition = selectedPosition?.area?.trim() ?? '';
      if (!areaFromPosition) {
        setError('El cargo seleccionado no tiene área configurada.');
        return;
      }
    }

    const salary = Number(values.salaryAmount);
    if (!Number.isFinite(salary) || salary <= 0) {
      setError('El salario debe ser un número mayor que 0.');
      return;
    }

    if (values.nonSalaryAmount !== '') {
      const nsa = Number(values.nonSalaryAmount);
      if (!Number.isFinite(nsa) || nsa < 0) {
        setError('El valor no salarial debe ser un número positivo.');
        return;
      }
    }

    const missingCatalogField = REQUIRED_CATALOG_FIELDS.find((field) => !values[field.key].trim());
    if (missingCatalogField) {
      setError(`${missingCatalogField.label} es obligatorio.`);
      return;
    }

    for (let i = 0; i < values.beneficiaries.length; i++) {
      const b = values.beneficiaries[i];
      if (!b.fullName.trim()) {
        setError(`Beneficiario ${i + 1}: el nombre completo es obligatorio.`);
        return;
      }
      const age = Number(b.age);
      if (!Number.isInteger(age) || age < 0 || age > 99) {
        setError(`Beneficiario ${i + 1}: la edad debe ser entre 0 y 99.`);
        return;
      }
    }

    setError(null);
    const areaFromPosition = hasActivePositions
      ? (selectedPosition?.area?.trim() ?? '')
      : values.area;
    onSubmit({
      ...values,
      area: areaFromPosition,
    });
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
          {/* ── Datos personales ─────────────────────────────────────────── */}
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Barrio</span>
            <input
              aria-label="Barrio"
              className={styles.input}
              maxLength={100}
              value={values.barrio}
              onChange={(event) => update({ barrio: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Localidad / Ciudad</span>
            <input
              aria-label="Localidad"
              className={styles.input}
              maxLength={100}
              value={values.localidad}
              onChange={(event) => update({ localidad: event.target.value })}
            />
          </label>

          {/* ── Rol del sistema (auth) y clasificación operacional ────────── */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rol del sistema *</span>
            <RecetaFilterSelect
              aria-label="Rol del sistema"
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
            <span className={styles.fieldLabel}>Centro de Costos *</span>
            <RecetaFilterSelect
              aria-label="Centro de Costos"
              options={COST_CENTER_OPTIONS}
              value={values.costCenter}
              onChange={(value) => update({ costCenter: value as CostCenter })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Áreas *</span>
            <RecetaFilterSelect
              aria-label="Áreas"
              options={locationSelectOptions}
              value={values.locationId}
              disabled={locationsQuery.isLoading && !locations}
              placeholder={
                locationsQuery.isLoading && !locations ? 'Cargando áreas...' : 'Seleccionar área'
              }
              onChange={(value) => update({ locationId: value })}
              theme={theme}
              size="md"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Clasificación mano de obra *</span>
            <RecetaFilterSelect
              aria-label="Clasificación mano de obra"
              options={LABOR_CLASSIFICATION_OPTIONS}
              value={values.laborClassification}
              onChange={(value) => update({ laborClassification: value as LaborClassification })}
              theme={theme}
              size="md"
            />
          </div>

          {/* ── Cargo ────────────────────────────────────────────────────── */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Cargo {hasActivePositions ? '*' : ''}</span>
            {hasActivePositions ? (
              <>
                <RecetaFilterSelect
                  aria-label="Cargo"
                  options={positionSelectOptions}
                  value={values.positionId}
                  disabled={positionsQuery.isLoading}
                  placeholder={
                    positionsQuery.isLoading
                      ? 'Cargando cargos...'
                      : positionsQuery.isError
                        ? 'Error al cargar cargos'
                        : 'Seleccionar cargo'
                  }
                  onChange={(value) => {
                    const position = (positionsQuery.data ?? []).find((item) => item.id === value);
                    update({
                      positionId: value,
                      area: position?.area ?? '',
                    });
                  }}
                  theme={theme}
                  size="md"
                />
                {selectedPosition ? (
                  <small>
                    Rango salarial de referencia:{' '}
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(selectedPosition.baseSalaryRange)}
                  </small>
                ) : null}
              </>
            ) : (
              <>
                <input
                  aria-label="Cargo"
                  className={styles.input}
                  value={values.area}
                  placeholder="Ej: Administrador"
                  onChange={(event) => update({ area: event.target.value, positionId: '' })}
                />
                <small className={styles.fieldHint}>Lista en configuración</small>
              </>
            )}
          </div>

          {/* ── Departamento ─────────────────────────────────────────────── */}
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

          {/* ── Contrato ─────────────────────────────────────────────────── */}
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

          {/* ── Salario ──────────────────────────────────────────────────── */}
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
            <span className={styles.fieldLabel}>No salariales (COP)</span>
            <input
              aria-label="No salariales"
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={values.nonSalaryAmount}
              placeholder="0.00"
              onChange={(event) => update({ nonSalaryAmount: event.target.value })}
            />
          </label>

          {/* ── Seguridad social ─────────────────────────────────────────── */}
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

        {/* ── Beneficiarios ──────────────────────────────────────────────── */}
        <section className={styles.beneficiariesSection}>
          <div className={styles.beneficiariesHeader}>
            <span className={styles.beneficiariesTitle}>Beneficiarios</span>
            <button type="button" className={styles.buttonSecondary} onClick={addBeneficiary}>
              + Agregar beneficiario
            </button>
          </div>
          {values.beneficiaries.length > 0 ? (
            <div className={styles.beneficiaryList}>
              <div className={styles.beneficiaryHeader}>
                <span>Tipo</span>
                <span>Nombre completo</span>
                <span>Edad</span>
                <span />
              </div>
              {values.beneficiaries.map((b, index) => (
                <div key={index} className={styles.beneficiaryRow}>
                  <div>
                    <RecetaFilterSelect
                      aria-label={`Tipo beneficiario ${index + 1}`}
                      options={BENEFICIARY_TYPE_OPTIONS}
                      value={b.relationshipType}
                      onChange={(value) =>
                        updateBeneficiary(index, {
                          relationshipType: value as BeneficiaryRelationshipType,
                        })
                      }
                      theme={theme}
                      size="sm"
                    />
                  </div>
                  <div>
                    <input
                      aria-label={`Nombre beneficiario ${index + 1}`}
                      className={styles.input}
                      value={b.fullName}
                      placeholder="Nombre completo"
                      onChange={(event) =>
                        updateBeneficiary(index, { fullName: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <input
                      aria-label={`Edad beneficiario ${index + 1}`}
                      className={styles.input}
                      type="number"
                      min="0"
                      max="99"
                      value={b.age}
                      placeholder="0"
                      onChange={(event) => updateBeneficiary(index, { age: event.target.value })}
                    />
                  </div>
                  <div className={styles.beneficiaryRemoveCell}>
                    <button
                      type="button"
                      className={styles.btnRemove}
                      aria-label={`Eliminar beneficiario ${index + 1}`}
                      onClick={() => removeBeneficiary(index)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.formHint}>Sin beneficiarios registrados.</p>
          )}
        </section>

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
