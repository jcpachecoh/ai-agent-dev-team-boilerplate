import { Combobox, RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { ThousandsInput } from '@/components/shared/ThousandsInput';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useLocations } from '@/features/sedes/hooks/useLocations';

import {
  type ArlRiskLevel,
  type BeneficiaryFormRow,
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
import { getColombiaCities, getColombiaDepartments } from '../api/personal-data.client';
import { getBarriosForLocalidad, getLocalidadesForCiudad } from '../constants/colombia-geo';
import { splitEmployeeNameForForm } from '../utils/employee-name';
import {
  BENEFICIARY_TYPE_OPTIONS,
  DISABILITY_OPTIONS,
  buildBeneficiaryFullName,
  calculateAge,
  validateBeneficiaryForm,
} from '../utils/beneficiary';
import { PayrollBeneficiaryFormModal } from './PayrollBeneficiaryFormModal';
import defaultStyles from '../payroll.module.scss';
import wizardStyles from './PayrollEmployeeFormWizard.module.scss';

export type PayrollEmployeeFormWizardStep = 'personal' | 'social-security';

export type PayrollEmployeeFormLayout = 'default' | 'wizard';

export interface PayrollEmployeeFormProps {
  mode: 'create' | 'edit';
  initialValues?: PayrollEmployee;
  locations?: Array<{ id: string; name: string; isActive?: boolean }>;
  onCancel: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
  submitting?: boolean;
  wizardStep?: PayrollEmployeeFormWizardStep;
  hideFooter?: boolean;
  layout?: PayrollEmployeeFormLayout;
  controlledValues?: PayrollEmployeeFormValues;
  onControlledValuesChange?: (values: PayrollEmployeeFormValues) => void;
  sectionScope?: 'default' | 'employment-only';
}

export const PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES: PayrollEmployeeFormValues = {
  cedula: '',
  documentType: 'CC',
  email: '',
  locationId: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
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
  departamento: '',
  ciudad: '',
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
  { key: 'department', label: 'Área' },
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
  const nameParts = splitEmployeeNameForForm(employee.name);
  return {
    cedula: employee.user?.cedula ?? '',
    documentType: (employee.user?.documentType as DocumentType) ?? 'CC',
    email: employee.user?.email ?? '',
    locationId: employee.locationId ?? '',
    primerNombre: nameParts.primerNombre,
    segundoNombre: nameParts.segundoNombre,
    primerApellido: nameParts.primerApellido,
    segundoApellido: nameParts.segundoApellido,
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
    departamento: '',
    ciudad: '',
    barrio: employee.barrio ?? '',
    localidad: employee.localidad ?? '',
    costCenter: (employee.costCenter as CostCenter) ?? 'OPERACIONES',
    laborClassification: (employee.laborClassification as LaborClassification) ?? 'ADMINISTRATIVO',
    nonSalaryAmount: employee.nonSalaryAmount ?? '',
    beneficiaries: (employee.beneficiaries ?? []).map((b) => ({
      documentType: b.documentType ?? '',
      documentNumber: b.documentNumber ?? '',
      relationshipType: b.relationshipType,
      primerNombre: b.primerNombre ?? '',
      segundoNombre: b.segundoNombre ?? '',
      primerApellido: b.primerApellido ?? '',
      segundoApellido: b.segundoApellido ?? '',
      fechaNacimiento: toDateInputValue(b.birthDate),
      disability: b.disability,
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
  { value: 'ROTANTE', label: 'Rotante' },
];

const LABOR_CLASSIFICATION_OPTIONS: Array<{ value: LaborClassification; label: string }> = [
  { value: 'COCINA', label: 'Cocina' },
  { value: 'SERVICIO', label: 'Servicio' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

export function PayrollEmployeeForm({
  mode,
  initialValues,
  locations,
  onCancel,
  onSubmit,
  submitting = false,
  wizardStep,
  hideFooter = false,
  layout = 'default',
  controlledValues,
  onControlledValuesChange,
  sectionScope = 'default',
}: PayrollEmployeeFormProps): React.JSX.Element {
  const formStyles = layout === 'wizard' ? wizardStyles : defaultStyles;
  const theme = useUiTheme();
  const locationsQuery = useLocations();
  const catalogsQuery = useEmployeeCatalogsGrouped();
  const positionsQuery = useEmployeePositions({ includeInactive: false });
  const locationRows = locations ?? locationsQuery.data ?? [];
  const [internalValues, setInternalValues] = useState<PayrollEmployeeFormValues>(
    initialValues ? employeeToFormValues(initialValues) : PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES,
  );
  const [error, setError] = useState<string | null>(null);
  const [beneficiaryModal, setBeneficiaryModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    index?: number;
  }>({ open: false, mode: 'create' });
  const values = controlledValues ?? internalValues;

  const setValues = (
    updater:
      | PayrollEmployeeFormValues
      | ((previous: PayrollEmployeeFormValues) => PayrollEmployeeFormValues),
  ) => {
    const next =
      typeof updater === 'function' ? updater(controlledValues ?? internalValues) : updater;

    if (onControlledValuesChange) {
      onControlledValuesChange(next);
      return;
    }

    setInternalValues(next);
  };

  const showPersonalFields = !wizardStep || wizardStep === 'personal';
  const showSocialFields = !wizardStep || wizardStep === 'social-security';
  const showPersonalIdentityFields = showPersonalFields && sectionScope !== 'employment-only';

  const [departamentoOptions, setDepartamentoOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [ciudadOptions, setCiudadOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (!showPersonalIdentityFields) return;
    let cancelled = false;
    getColombiaDepartments()
      .then((items) => {
        if (cancelled) return;
        setDepartamentoOptions(items.map((item) => ({ value: item.code, label: item.name })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [showPersonalIdentityFields]);

  useEffect(() => {
    if (!showPersonalIdentityFields || !values.departamento) {
      setCiudadOptions([]);
      return;
    }
    let cancelled = false;
    getColombiaCities(values.departamento)
      .then((cities) => {
        if (cancelled) return;
        setCiudadOptions(cities.map((city) => ({ value: city, label: city })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [showPersonalIdentityFields, values.departamento]);

  // Ciudades/localidades sin catálogo caen a texto libre para no bloquear el registro.
  const hasLocalidadCatalog = getLocalidadesForCiudad(values.ciudad).length > 0;
  const hasBarrioCatalog = getBarriosForLocalidad(values.ciudad, values.localidad).length > 0;

  const localidadOptions = useMemo(() => {
    const options = getLocalidadesForCiudad(values.ciudad).map((localidad) => ({
      value: localidad,
      label: localidad,
    }));
    // Valores guardados que no están en el catálogo siguen siendo seleccionables.
    if (values.localidad && !options.some((option) => option.value === values.localidad)) {
      options.unshift({ value: values.localidad, label: values.localidad });
    }
    return options;
  }, [values.ciudad, values.localidad]);

  const barrioOptions = useMemo(() => {
    const options = getBarriosForLocalidad(values.ciudad, values.localidad).map((barrio) => ({
      value: barrio,
      label: barrio,
    }));
    if (values.barrio && !options.some((option) => option.value === values.barrio)) {
      options.unshift({ value: values.barrio, label: values.barrio });
    }
    return options;
  }, [values.ciudad, values.localidad, values.barrio]);

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

  const locationSelectOptions = useMemo(
    () => locationOptions.map((location) => ({ value: location.id, label: location.name })),
    [locationOptions],
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
        label: position.title,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));

    if (values.positionId && !options.some((option) => option.value === values.positionId)) {
      const current = positionsQuery.data?.find((position) => position.id === values.positionId);
      if (current) {
        options.unshift({
          value: current.id,
          label: current.title,
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
    if (controlledValues) return;
    setInternalValues(
      initialValues ? employeeToFormValues(initialValues) : PAYROLL_EMPLOYEE_FORM_EMPTY_VALUES,
    );
    setError(null);
  }, [controlledValues, initialValues, mode]);

  const update = (patch: Partial<PayrollEmployeeFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const openAddBeneficiary = () => setBeneficiaryModal({ open: true, mode: 'create' });

  const openEditBeneficiary = (index: number) =>
    setBeneficiaryModal({ open: true, mode: 'edit', index });

  const closeBeneficiaryModal = () => setBeneficiaryModal({ open: false, mode: 'create' });

  const submitBeneficiary = (row: BeneficiaryFormRow) => {
    setValues((prev) => {
      if (beneficiaryModal.mode === 'edit' && beneficiaryModal.index !== undefined) {
        const next = [...prev.beneficiaries];
        next[beneficiaryModal.index] = row;
        return { ...prev, beneficiaries: next };
      }
      return { ...prev, beneficiaries: [...prev.beneficiaries, row] };
    });
    closeBeneficiaryModal();
  };

  const removeBeneficiary = (index: number) =>
    setValues((prev) => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter((_, i) => i !== index),
    }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !values.primerNombre.trim() ||
      !values.primerApellido.trim() ||
      !values.email.trim() ||
      !values.cedula.trim()
    ) {
      setError('Primer nombre, primer apellido, correo y cédula son obligatorios.');
      return;
    }

    if (!values.costCenter) {
      setError('Centro de Costos es obligatorio.');
      return;
    }

    // Rotante no tiene sede fija — la sede diaria se resuelve por turno/marcación (CONN-06).
    if (values.costCenter !== 'ROTANTE' && !values.locationId.trim()) {
      setError('La sede es obligatoria.');
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
      const beneficiaryErrors = validateBeneficiaryForm(values.beneficiaries[i]);
      const firstError = Object.values(beneficiaryErrors)[0];
      if (firstError) {
        setError(`Beneficiario ${i + 1}: ${firstError}`);
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
      // Rotante nunca envía sede fija, incluso si quedó un valor residual (CONN-06).
      locationId: values.costCenter === 'ROTANTE' ? '' : values.locationId,
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
    <form className={layout === 'wizard' ? formStyles.form : undefined} onSubmit={handleSubmit}>
      <div className={formStyles.modalBody}>
        {catalogsError ? (
          <p className={formStyles.error}>
            No se pudieron cargar los catálogos. Recarga la página e intenta de nuevo.
          </p>
        ) : null}
        <div className={formStyles.formGrid}>
          {showPersonalFields ? (
            <>
              {showPersonalIdentityFields ? (
                <>
                  {/* ── Datos personales ─────────────────────────────────────────── */}
                  <div className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Tipo de documento</span>
                    <RecetaFilterSelect
                      aria-label="Tipo de documento"
                      options={DOCUMENT_TYPE_OPTIONS}
                      value={values.documentType}
                      onChange={(value) => update({ documentType: value as DocumentType })}
                      theme={theme}
                      size="md"
                    />
                  </div>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Cédula *</span>
                    <input
                      aria-label="Cédula"
                      className={formStyles.input}
                      value={values.cedula}
                      onChange={(event) => update({ cedula: event.target.value })}
                    />
                  </label>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Primer nombre *</span>
                    <input
                      aria-label="Primer nombre"
                      className={formStyles.input}
                      value={values.primerNombre}
                      onChange={(event) => update({ primerNombre: event.target.value })}
                    />
                  </label>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Segundo nombre</span>
                    <input
                      aria-label="Segundo nombre"
                      className={formStyles.input}
                      value={values.segundoNombre}
                      onChange={(event) => update({ segundoNombre: event.target.value })}
                    />
                  </label>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Primer apellido *</span>
                    <input
                      aria-label="Primer apellido"
                      className={formStyles.input}
                      value={values.primerApellido}
                      onChange={(event) => update({ primerApellido: event.target.value })}
                    />
                  </label>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Segundo apellido</span>
                    <input
                      aria-label="Segundo apellido"
                      className={formStyles.input}
                      value={values.segundoApellido}
                      onChange={(event) => update({ segundoApellido: event.target.value })}
                    />
                  </label>
                  <label className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Correo *</span>
                    <input
                      aria-label="Correo"
                      className={formStyles.input}
                      type="email"
                      value={values.email}
                      onChange={(event) => update({ email: event.target.value })}
                    />
                  </label>
                  {/* ── Ubicación ─────────────────────────────────────────────────── */}
                  <div className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Departamento</span>
                    <Combobox
                      options={departamentoOptions}
                      value={values.departamento}
                      placeholder="Seleccionar departamento"
                      searchPlaceholder="Buscar departamento…"
                      className={formStyles.combobox}
                      onChange={(value) => {
                        if (typeof value !== 'string') return;
                        update({
                          departamento: value,
                          // Al cambiar el departamento, los niveles inferiores dejan de ser válidos.
                          ciudad: value === values.departamento ? values.ciudad : '',
                          localidad: value === values.departamento ? values.localidad : '',
                          barrio: value === values.departamento ? values.barrio : '',
                        });
                      }}
                      theme={theme}
                      size="md"
                    />
                  </div>
                  <div className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Ciudad</span>
                    <Combobox
                      options={ciudadOptions}
                      value={values.ciudad}
                      placeholder={
                        values.departamento ? 'Seleccionar ciudad' : 'Selecciona un departamento'
                      }
                      searchPlaceholder="Buscar ciudad…"
                      className={formStyles.combobox}
                      emptyMessage={
                        values.departamento
                          ? 'Sin resultados.'
                          : 'Selecciona un departamento primero.'
                      }
                      onChange={(value) => {
                        if (typeof value !== 'string') return;
                        update({
                          ciudad: value,
                          // Al cambiar la ciudad, localidad y barrio dejan de ser válidos.
                          localidad: value === values.ciudad ? values.localidad : '',
                          barrio: value === values.ciudad ? values.barrio : '',
                        });
                      }}
                      theme={theme}
                      size="md"
                    />
                  </div>
                  <div className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Localidad</span>
                    {hasLocalidadCatalog ? (
                      <Combobox
                        options={localidadOptions}
                        value={values.localidad}
                        placeholder="Seleccionar localidad"
                        searchPlaceholder="Buscar localidad…"
                        className={formStyles.combobox}
                        onChange={(value) => {
                          if (typeof value !== 'string') return;
                          update({
                            localidad: value,
                            // Al cambiar la localidad el barrio deja de ser válido.
                            barrio: value === values.localidad ? values.barrio : '',
                          });
                        }}
                        theme={theme}
                        size="md"
                      />
                    ) : (
                      <input
                        aria-label="Localidad"
                        className={formStyles.input}
                        maxLength={100}
                        placeholder={values.ciudad ? '' : 'Selecciona una ciudad primero'}
                        disabled={!values.ciudad}
                        value={values.localidad}
                        onChange={(event) => update({ localidad: event.target.value })}
                      />
                    )}
                  </div>
                  <div className={formStyles.field}>
                    <span className={formStyles.fieldLabel}>Barrio</span>
                    {hasBarrioCatalog ? (
                      <Combobox
                        options={barrioOptions}
                        value={values.barrio}
                        placeholder="Seleccionar barrio"
                        searchPlaceholder="Buscar barrio…"
                        className={formStyles.combobox}
                        onChange={(value) => {
                          if (typeof value !== 'string') return;
                          update({ barrio: value });
                        }}
                        theme={theme}
                        size="md"
                      />
                    ) : (
                      <input
                        aria-label="Barrio"
                        className={formStyles.input}
                        maxLength={100}
                        placeholder={values.ciudad ? '' : 'Selecciona una ciudad primero'}
                        disabled={!values.ciudad}
                        value={values.barrio}
                        onChange={(event) => update({ barrio: event.target.value })}
                      />
                    )}
                  </div>
                </>
              ) : null}

              {/* ── Clasificación operacional ─────────────────────────────────── */}
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Centro de Costos *</span>
                <RecetaFilterSelect
                  aria-label="Centro de Costos"
                  options={COST_CENTER_OPTIONS}
                  value={values.costCenter}
                  onChange={(value) =>
                    update({
                      costCenter: value as CostCenter,
                      // OS-531/CONN-06: Rotante no tiene sede fija — se limpia al seleccionarlo.
                      locationId: value === 'ROTANTE' ? '' : values.locationId,
                    })
                  }
                  theme={theme}
                  size="md"
                />
              </div>
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>
                  Sedes {values.costCenter === 'ROTANTE' ? '' : '*'}
                </span>
                <RecetaFilterSelect
                  aria-label="Sedes"
                  options={locationSelectOptions}
                  value={values.locationId}
                  disabled={
                    values.costCenter === 'ROTANTE' || (locationsQuery.isLoading && !locations)
                  }
                  placeholder={
                    values.costCenter === 'ROTANTE'
                      ? 'No aplica para Rotante'
                      : locationsQuery.isLoading && !locations
                        ? 'Cargando sedes...'
                        : 'Seleccionar sede'
                  }
                  onChange={(value) => update({ locationId: value })}
                  theme={theme}
                  size="md"
                />
                {values.costCenter === 'ROTANTE' ? (
                  <small className={formStyles.fieldHint}>
                    La sede se determina automáticamente por turno o marcación diaria.
                  </small>
                ) : null}
              </div>
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Clasificación mano de obra *</span>
                <RecetaFilterSelect
                  aria-label="Clasificación mano de obra"
                  options={LABOR_CLASSIFICATION_OPTIONS}
                  value={values.laborClassification}
                  onChange={(value) =>
                    update({ laborClassification: value as LaborClassification })
                  }
                  theme={theme}
                  size="md"
                />
              </div>

              {/* ── Cargo ────────────────────────────────────────────────────── */}
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Cargo {hasActivePositions ? '*' : ''}</span>
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
                        const position = (positionsQuery.data ?? []).find(
                          (item) => item.id === value,
                        );
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
                      className={formStyles.input}
                      value={values.area}
                      placeholder="Ej: Administrador"
                      onChange={(event) => update({ area: event.target.value, positionId: '' })}
                    />
                    <small className={formStyles.fieldHint}>Lista en configuración</small>
                  </>
                )}
              </div>

              {/* ── Área (catálogo organizacional, antes "Departamento") ─────── */}
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Área *</span>
                <RecetaFilterSelect
                  aria-label="Área"
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
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Tipo de contrato</span>
                <RecetaFilterSelect
                  aria-label="Tipo de contrato"
                  options={CONTRACT_TYPE_OPTIONS}
                  value={values.contractType}
                  onChange={(value) =>
                    update({
                      contractType: value as EmployeeContractType,
                      // Un contrato indefinido no tiene fecha de finalización.
                      contractEnd: value === 'INDEFINIDO' ? '' : values.contractEnd,
                    })
                  }
                  theme={theme}
                  size="md"
                />
              </div>
              <label className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Fecha de ingreso</span>
                <input
                  className={formStyles.input}
                  type="date"
                  value={values.hireDate}
                  onChange={(event) => update({ hireDate: event.target.value })}
                />
              </label>
              <label className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Inicio de contrato</span>
                <input
                  className={formStyles.input}
                  type="date"
                  value={values.contractStart}
                  onChange={(event) => update({ contractStart: event.target.value })}
                />
              </label>
              {values.contractType !== 'INDEFINIDO' ? (
                <label className={formStyles.field}>
                  <span className={formStyles.fieldLabel}>Fin de contrato</span>
                  <input
                    className={formStyles.input}
                    type="date"
                    value={values.contractEnd}
                    onChange={(event) => update({ contractEnd: event.target.value })}
                  />
                </label>
              ) : null}

              {/* ── Salario ──────────────────────────────────────────────────── */}
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Tipo de salario</span>
                <RecetaFilterSelect
                  aria-label="Tipo de salario"
                  options={SALARY_TYPE_OPTIONS}
                  value={values.salaryType}
                  onChange={(value) => update({ salaryType: value as SalaryType })}
                  theme={theme}
                  size="md"
                />
              </div>
              <label className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Salario</span>
                <ThousandsInput
                  aria-label="Salario"
                  className={formStyles.input}
                  placeholder="0"
                  value={values.salaryAmount}
                  onChange={(num) => update({ salaryAmount: String(num) })}
                />
              </label>
              <label className={formStyles.field}>
                <span className={formStyles.fieldLabel}>No salariales (COP)</span>
                <ThousandsInput
                  aria-label="No salariales"
                  className={formStyles.input}
                  placeholder="0"
                  value={values.nonSalaryAmount}
                  onChange={(num) => update({ nonSalaryAmount: String(num) })}
                />
              </label>
            </>
          ) : null}

          {showSocialFields ? (
            <>
              {/* ── Seguridad social ─────────────────────────────────────────── */}
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>EPS *</span>
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
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Fondo de pensión *</span>
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
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Fondo de cesantías *</span>
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
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>ARL *</span>
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
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Nivel ARL</span>
                <RecetaFilterSelect
                  aria-label="Nivel ARL"
                  options={ARL_LEVEL_OPTIONS}
                  value={values.arlRiskLevel}
                  onChange={(value) => update({ arlRiskLevel: value as ArlRiskLevel })}
                  theme={theme}
                  size="md"
                />
              </div>
              <div className={formStyles.field}>
                <span className={formStyles.fieldLabel}>Caja de compensación *</span>
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
            </>
          ) : null}
        </div>

        {showPersonalFields ? (
          <section className={formStyles.beneficiariesSection}>
            <div className={formStyles.beneficiariesHeader}>
              <span className={formStyles.beneficiariesTitle}>Beneficiarios</span>
              <button
                type="button"
                className={formStyles.buttonSecondary}
                onClick={openAddBeneficiary}
              >
                + Agregar beneficiario
              </button>
            </div>
            {values.beneficiaries.length > 0 ? (
              <div className={formStyles.beneficiaryListScroll}>
                <div className={formStyles.beneficiaryList}>
                  <div className={formStyles.beneficiaryHeader}>
                    <span>Tipo</span>
                    <span>Nombre completo</span>
                    <span>Documento</span>
                    <span>Fecha de nacimiento</span>
                    <span>Discapacidad</span>
                    <span>Edad</span>
                    <span />
                  </div>
                  {values.beneficiaries.map((b, index) => (
                    <div key={index} className={formStyles.beneficiaryRow}>
                      <span>
                        {BENEFICIARY_TYPE_OPTIONS.find(
                          (option) => option.value === b.relationshipType,
                        )?.label ?? b.relationshipType}
                      </span>
                      <span>{buildBeneficiaryFullName(b) || '—'}</span>
                      <span>
                        {b.documentType ? `${b.documentType} ${b.documentNumber}`.trim() : '—'}
                      </span>
                      <span>{b.fechaNacimiento || '—'}</span>
                      <span>
                        {DISABILITY_OPTIONS.find((option) => option.value === b.disability)
                          ?.label ?? b.disability}
                      </span>
                      <span>{calculateAge(b.fechaNacimiento) ?? '—'}</span>
                      <div className={formStyles.beneficiaryActionsCell}>
                        <button
                          type="button"
                          className={formStyles.btnEdit}
                          aria-label={`Editar beneficiario ${index + 1}`}
                          onClick={() => openEditBeneficiary(index)}
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
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={formStyles.btnRemove}
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
              </div>
            ) : (
              <p className={formStyles.formHint}>Sin beneficiarios registrados.</p>
            )}
            <PayrollBeneficiaryFormModal
              open={beneficiaryModal.open}
              mode={beneficiaryModal.mode}
              theme={theme}
              initialValues={
                beneficiaryModal.index !== undefined
                  ? values.beneficiaries[beneficiaryModal.index]
                  : undefined
              }
              onClose={closeBeneficiaryModal}
              onSubmit={submitBeneficiary}
            />
          </section>
        ) : null}

        {error ? <p className={formStyles.error}>{error}</p> : null}
        {!hideFooter ? (
          <p className={formStyles.formHint}>
            Los campos con * son obligatorios para crear y actualizar.
          </p>
        ) : null}
      </div>
      {hideFooter ? null : (
        <footer className={formStyles.modalFooter}>
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
      )}
    </form>
  );
}
