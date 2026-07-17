import {
  Combobox,
  EmpleadoAvatar,
  RecetaFilterSelect,
  RecetaFormButton,
  RecetaTextInput,
  resolveEmpleadoInitials,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { useAdminRolesForSelect } from '@/features/usuarios/hooks/useAdminUsers';
import { useUiTheme } from '@/hooks/useUiTheme';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import {
  getColombiaCities,
  getColombiaDepartments,
  updateEmployeePersonalData,
} from '../api/personal-data.client';
import { PayrollApiError } from '../api/payroll.client';
import { getBarriosForLocalidad, getLocalidadesForCiudad } from '../constants/colombia-geo';
import { useEmployeePersonalDataQuery } from '../hooks/useEmployeePersonalDataQuery';
import { useUpdatePayrollEmployeeMutation } from '../hooks/usePayrollEmployeeMutations';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type {
  EmployeePersonalData,
  PersonalDataFieldKey,
  UpdateEmployeePersonalDataInput,
} from '../types/personal-data.types';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { normalizeNameText } from '../utils/employee-name';
import {
  TIPO_VIA_OPTIONS,
  composeDireccion,
  normalizeDireccionText,
  parseDireccion,
} from '../utils/direccion';
import { buildNombres, splitNombresForForm } from '../utils/employee-name';
import {
  EMERGENCY_CONTACT_PENDING_MESSAGE,
  hasCompleteEmergencyContact,
  validateEmergencyContact,
} from '../utils/emergency-contact';
import {
  buildEmploymentDetailFields,
  formatBeneficiaryType,
} from '../utils/payroll-employee-display.utils';
import { payrollEmployeeFormValuesToUpdateInput } from '../utils/payroll-employee-form-mappers';
import { EmployeePhotoUploader } from './EmployeePhotoUploader';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeePersonalDataTab.module.scss';

const DOCUMENT_OPTIONS = [
  { value: 'CC', label: 'CC' },
  { value: 'CE', label: 'CE' },
  { value: 'TI', label: 'TI' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'PEP' },
];

const MARITAL_OPTIONS = [
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'UNION_LIBRE', label: 'Unión libre' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
];

const GENDER_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

function displayValue(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—';
  return value;
}

function optionLabel(
  options: Array<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  if (!value) return '—';
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Estado del formulario: datos personales + nombres divididos + dirección estructurada. */
interface PersonalFormState extends UpdateEmployeePersonalDataInput {
  primerNombre: string;
  segundoNombre: string;
  direccionTipoVia: string;
  direccionNumeroVia: string;
  direccionPlaca1: string;
  direccionPlaca2: string;
  direccionComplemento: string;
}

function toFormState(data: EmployeePersonalData): PersonalFormState {
  // Registros previos al backfill no tienen los campos divididos: se derivan de `nombres`.
  const nombresParts = splitNombresForForm(data.nombres ?? '');
  const direccionParts = parseDireccion(data.direccion);
  return {
    tipoDocumento: data.tipoDocumento ?? '',
    numeroDocumento: data.numeroDocumento ?? '',
    nombres: data.nombres ?? '',
    primerNombre: data.primerNombre ?? nombresParts.primerNombre,
    segundoNombre: data.segundoNombre ?? nombresParts.segundoNombre,
    primerApellido: data.primerApellido ?? '',
    segundoApellido: data.segundoApellido ?? '',
    fechaNacimiento: data.fechaNacimiento ?? '',
    estadoCivil: data.estadoCivil ?? '',
    sexo: data.sexo ?? '',
    departamento: data.departamento ?? '',
    ciudad: data.ciudad ?? '',
    localidad: data.localidad ?? '',
    barrio: data.barrio ?? '',
    direccion: data.direccion ?? '',
    ...direccionParts,
    telefono: data.telefono ?? '',
    correo: data.correo ?? '',
    contactoEmergenciaNombre: data.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: data.contactoEmergenciaTelefono ?? '',
    contactoEmergenciaParentesco: data.contactoEmergenciaParentesco ?? '',
    profilePhotoStorageObjectId: data.profilePhotoStorageObjectId,
  };
}

function validateForm(values: PersonalFormState): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!values.tipoDocumento) errors.tipoDocumento = 'Requerido';
  if (!values.numeroDocumento || !/^\d{1,15}$/.test(values.numeroDocumento)) {
    errors.numeroDocumento = 'Solo números, máx. 15 dígitos';
  }
  if (!values.primerNombre.trim()) errors.primerNombre = 'Requerido';
  if (!values.primerApellido?.trim()) errors.primerApellido = 'Requerido';
  if (!values.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) {
    errors.correo = 'Correo inválido';
  }
  if (values.telefono && !/^\d{7,15}$/.test(values.telefono)) {
    errors.telefono = 'Entre 7 y 15 dígitos';
  }
  // Al editar datos personales, el contacto de emergencia es obligatorio (nuevos y legacy).
  Object.assign(errors, validateEmergencyContact(values, { required: true }));
  if (values.fechaNacimiento) {
    const birth = new Date(`${values.fechaNacimiento}T00:00:00`);
    const now = new Date();
    if (birth > now) errors.fechaNacimiento = 'No puede ser futura';
    const age = now.getFullYear() - birth.getFullYear();
    if (age < 15) errors.fechaNacimiento = 'Edad mínima 15 años';
  }
  return errors;
}

interface PayrollEmployeePersonalDataTabProps {
  userId: string;
  theme: 'light' | 'dark';
  /** Oculta datos laborales y beneficiarios (autoservicio en Mi perfil). */
  showEmploymentSection?: boolean;
}

export function PayrollEmployeePersonalDataTab({
  userId,
  theme,
  showEmploymentSection = true,
}: PayrollEmployeePersonalDataTabProps): React.JSX.Element {
  const uiTheme = useUiTheme();
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canEditEmployment = canWritePayrollEmployee(roleCode);

  const query = useEmployeePersonalDataQuery(userId);
  const employeeQuery = usePayrollEmployeeQuery(userId);
  const rolesQuery = useAdminRolesForSelect();
  const updateEmploymentMutation = useUpdatePayrollEmployeeMutation();

  const [values, setValues] = useState<PersonalFormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingEmployment, setEditingEmployment] = useState(false);
  const [submittingEmployment, setSubmittingEmployment] = useState(false);

  const employee = employeeQuery.data;

  const roleName = useMemo(() => {
    if (!employee?.user?.roleId) return undefined;
    return rolesQuery.data?.find((role) => role.id === employee.user?.roleId)?.name;
  }, [employee?.user?.roleId, rolesQuery.data]);

  const employmentFields = useMemo(
    () => (employee ? buildEmploymentDetailFields(employee, roleName) : []),
    [employee, roleName],
  );

  useEffect(() => {
    if (query.data) {
      setValues(toFormState(query.data));
    }
  }, [query.data]);

  useEffect(() => {
    void getColombiaDepartments().then((items) => {
      setDepartments(items.map((item) => ({ value: item.code, label: item.name })));
    });
  }, []);

  useEffect(() => {
    if (!values?.departamento) {
      setCities([]);
      return;
    }
    void getColombiaCities(values.departamento).then((items) => {
      setCities(items.map((city) => ({ value: city, label: city })));
    });
  }, [values?.departamento]);

  const editable = useMemo(
    () => new Set<PersonalDataFieldKey>(query.data?.editableFields ?? []),
    [query.data?.editableFields],
  );

  const hasEditableFields = editable.size > 0;

  const canEdit = (field: PersonalDataFieldKey) => editingPersonal && editable.has(field);

  const fullName = [values?.nombres, values?.primerApellido, values?.segundoApellido]
    .filter(Boolean)
    .join(' ');

  const updateField = <K extends keyof PersonalFormState>(key: K, value: PersonalFormState[K]) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // Ciudades sin catálogo de localidades/barrios caen a texto libre.
  const hasLocalidadCatalog = getLocalidadesForCiudad(values?.ciudad ?? '').length > 0;
  const hasBarrioCatalog =
    getBarriosForLocalidad(values?.ciudad ?? '', values?.localidad ?? '').length > 0;

  const localidadOptions = useMemo(() => {
    const options = getLocalidadesForCiudad(values?.ciudad ?? '').map((localidad) => ({
      value: localidad,
      label: localidad,
    }));
    // Valores guardados que no están en el catálogo siguen siendo seleccionables.
    if (values?.localidad && !options.some((option) => option.value === values.localidad)) {
      options.unshift({ value: values.localidad, label: values.localidad });
    }
    return options;
  }, [values?.ciudad, values?.localidad]);

  const barrioOptions = useMemo(() => {
    const options = getBarriosForLocalidad(values?.ciudad ?? '', values?.localidad ?? '').map(
      (barrio) => ({ value: barrio, label: barrio }),
    );
    if (values?.barrio && !options.some((option) => option.value === values.barrio)) {
      options.unshift({ value: values.barrio, label: values.barrio });
    }
    return options;
  }, [values?.ciudad, values?.localidad, values?.barrio]);

  const direccionPreview = values ? composeDireccion(values) : '';

  const handleCancelPersonal = () => {
    if (query.data) {
      setValues(toFormState(query.data));
    }
    setErrors({});
    setEditingPersonal(false);
  };

  const handleSubmit = async () => {
    if (!values) return;
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: UpdateEmployeePersonalDataInput = {
        tipoDocumento: values.tipoDocumento,
        numeroDocumento: values.numeroDocumento,
        nombres: buildNombres(values),
        primerNombre: values.primerNombre.trim(),
        segundoNombre: values.segundoNombre.trim(),
        primerApellido: values.primerApellido,
        segundoApellido: values.segundoApellido,
        fechaNacimiento: values.fechaNacimiento,
        estadoCivil: values.estadoCivil || undefined,
        sexo: values.sexo || undefined,
        departamento: values.departamento,
        ciudad: values.ciudad,
        localidad: values.localidad,
        barrio: values.barrio,
        direccion: composeDireccion(values),
        telefono: values.telefono?.trim() || undefined,
        correo: values.correo,
        contactoEmergenciaNombre: values.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: values.contactoEmergenciaTelefono?.trim() || undefined,
        contactoEmergenciaParentesco: values.contactoEmergenciaParentesco,
        profilePhotoStorageObjectId: values.profilePhotoStorageObjectId,
      };

      await updateEmployeePersonalData(userId, payload);
      toast.success('Datos personales guardados');
      setEditingPersonal(false);
      await query.refetch();
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudieron guardar los datos';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmploymentCancel = () => {
    setEditingEmployment(false);
  };

  const handleEmploymentSubmit = async (formValues: PayrollEmployeeFormValues) => {
    setSubmittingEmployment(true);
    try {
      await updateEmploymentMutation.mutateAsync({
        userId,
        input: payrollEmployeeFormValuesToUpdateInput(formValues),
      });
      toast.success('Datos laborales actualizados');
      setEditingEmployment(false);
      await employeeQuery.refetch();
    } catch (error) {
      const message =
        error instanceof PayrollApiError
          ? error.message
          : 'No se pudieron guardar los datos laborales';
      toast.error(message);
    } finally {
      setSubmittingEmployment(false);
    }
  };

  if (query.isLoading || !values) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (query.isError) {
    return (
      <div className={styles.state}>
        <p>No se pudieron cargar los datos personales.</p>
        <button type="button" onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className={styles.employmentHeader}>
          <p className={styles.sectionTitle}>Datos personales</p>
          {hasEditableFields && !editingPersonal ? (
            <RecetaFormButton
              type="button"
              theme={theme}
              variant="add"
              label="Editar"
              onClick={() => setEditingPersonal(true)}
            />
          ) : null}
        </div>

        <div className={styles.photoRow}>
          {employee && editingPersonal && editable.has('profilePhotoStorageObjectId') ? (
            <EmployeePhotoUploader
              employee={employee}
              onPhotoUpdated={() => {
                void employeeQuery.refetch();
                void query.refetch();
              }}
            />
          ) : (
            <EmpleadoAvatar
              initials={resolveEmpleadoInitials(fullName || employee?.name || 'Empleado')}
              photoUrl={employee?.photoUrl ?? undefined}
              theme={theme}
              size="md"
            />
          )}
        </div>

        <p className={styles.sectionTitle}>Identificación</p>
        <div className={styles.grid}>
          <Field label="Tipo de documento" error={errors.tipoDocumento}>
            {canEdit('tipoDocumento') ? (
              <RecetaFilterSelect
                theme={uiTheme}
                size="md"
                value={values.tipoDocumento ?? ''}
                options={DOCUMENT_OPTIONS}
                onChange={(value) => updateField('tipoDocumento', value)}
              />
            ) : (
              <Readonly value={displayValue(values.tipoDocumento)} />
            )}
          </Field>
          <Field label="Número de documento" error={errors.numeroDocumento}>
            {canEdit('numeroDocumento') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.numeroDocumento ?? ''}
                onChange={(event) =>
                  updateField('numeroDocumento', event.target.value.replace(/\D/g, ''))
                }
              />
            ) : (
              <Readonly value={displayValue(values.numeroDocumento)} />
            )}
          </Field>
          <Field label="Primer nombre" error={errors.primerNombre}>
            {canEdit('nombres') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.primerNombre}
                onChange={(event) =>
                  updateField('primerNombre', normalizeNameText(event.target.value))
                }
              />
            ) : (
              <Readonly value={displayValue(values.primerNombre)} />
            )}
          </Field>
          <Field label="Segundo nombre">
            {canEdit('nombres') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.segundoNombre}
                onChange={(event) =>
                  updateField('segundoNombre', normalizeNameText(event.target.value))
                }
              />
            ) : (
              <Readonly value={displayValue(values.segundoNombre)} />
            )}
          </Field>
          <Field label="Primer apellido" error={errors.primerApellido}>
            {canEdit('primerApellido') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.primerApellido ?? ''}
                onChange={(event) =>
                  updateField('primerApellido', normalizeNameText(event.target.value))
                }
              />
            ) : (
              <Readonly value={displayValue(values.primerApellido)} />
            )}
          </Field>
          <Field label="Segundo apellido">
            {canEdit('segundoApellido') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.segundoApellido ?? ''}
                onChange={(event) =>
                  updateField('segundoApellido', normalizeNameText(event.target.value))
                }
              />
            ) : (
              <Readonly value={displayValue(values.segundoApellido)} />
            )}
          </Field>
          <Field label="Fecha de nacimiento" error={errors.fechaNacimiento}>
            {canEdit('fechaNacimiento') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                type="date"
                value={values.fechaNacimiento ?? ''}
                onChange={(event) => updateField('fechaNacimiento', event.target.value)}
              />
            ) : (
              <Readonly value={displayValue(values.fechaNacimiento)} />
            )}
          </Field>
          <Field label="Estado civil">
            {canEdit('estadoCivil') ? (
              <RecetaFilterSelect
                theme={uiTheme}
                size="md"
                value={values.estadoCivil ?? ''}
                options={MARITAL_OPTIONS}
                onChange={(value) =>
                  updateField('estadoCivil', value as PersonalFormState['estadoCivil'])
                }
              />
            ) : (
              <Readonly value={optionLabel(MARITAL_OPTIONS, values.estadoCivil)} />
            )}
          </Field>
          <Field label="Sexo">
            {canEdit('sexo') ? (
              <RecetaFilterSelect
                theme={uiTheme}
                size="md"
                value={values.sexo ?? ''}
                options={GENDER_OPTIONS}
                onChange={(value) => updateField('sexo', value as PersonalFormState['sexo'])}
              />
            ) : (
              <Readonly value={optionLabel(GENDER_OPTIONS, values.sexo)} />
            )}
          </Field>
        </div>

        <p className={styles.sectionTitle}>Ubicación y contacto</p>
        <div className={styles.grid}>
          <Field label="Departamento">
            {canEdit('departamento') ? (
              <Combobox
                options={departments}
                value={values.departamento ?? ''}
                placeholder="Seleccionar departamento"
                searchPlaceholder="Buscar departamento…"
                className={styles.combobox}
                onChange={(value) => {
                  if (typeof value !== 'string') return;
                  setValues((current) =>
                    current
                      ? {
                          ...current,
                          departamento: value,
                          // Al cambiar el departamento, los niveles inferiores dejan de ser válidos.
                          ciudad: value === current.departamento ? current.ciudad : '',
                          localidad: value === current.departamento ? current.localidad : '',
                          barrio: value === current.departamento ? current.barrio : '',
                        }
                      : current,
                  );
                }}
                theme={uiTheme}
                size="md"
              />
            ) : (
              <Readonly value={optionLabel(departments, values.departamento)} />
            )}
          </Field>
          <Field label="Ciudad">
            {canEdit('ciudad') ? (
              <Combobox
                options={cities}
                value={values.ciudad ?? ''}
                placeholder={
                  values.departamento ? 'Seleccionar ciudad' : 'Selecciona un departamento'
                }
                searchPlaceholder="Buscar ciudad…"
                className={styles.combobox}
                emptyMessage={
                  values.departamento ? 'Sin resultados.' : 'Selecciona un departamento primero.'
                }
                onChange={(value) => {
                  if (typeof value !== 'string') return;
                  setValues((current) =>
                    current
                      ? {
                          ...current,
                          ciudad: value,
                          // Al cambiar la ciudad, localidad y barrio dejan de ser válidos.
                          localidad: value === current.ciudad ? current.localidad : '',
                          barrio: value === current.ciudad ? current.barrio : '',
                        }
                      : current,
                  );
                }}
                theme={uiTheme}
                size="md"
              />
            ) : (
              <Readonly value={displayValue(values.ciudad)} />
            )}
          </Field>
          <Field label="Localidad">
            {canEdit('localidad') ? (
              hasLocalidadCatalog ? (
                <Combobox
                  options={localidadOptions}
                  value={values.localidad ?? ''}
                  placeholder="Seleccionar localidad"
                  searchPlaceholder="Buscar localidad…"
                  className={styles.combobox}
                  onChange={(value) => {
                    if (typeof value !== 'string') return;
                    setValues((current) =>
                      current
                        ? {
                            ...current,
                            localidad: value,
                            // Al cambiar la localidad el barrio deja de ser válido.
                            barrio: value === current.localidad ? current.barrio : '',
                          }
                        : current,
                    );
                  }}
                  theme={uiTheme}
                  size="md"
                />
              ) : (
                <RecetaTextInput
                  theme={uiTheme}
                  className={styles.controlMd}
                  placeholder={values.ciudad ? '' : 'Selecciona una ciudad primero'}
                  disabled={!values.ciudad}
                  value={values.localidad ?? ''}
                  onChange={(event) => updateField('localidad', event.target.value)}
                />
              )
            ) : (
              <Readonly value={displayValue(values.localidad)} />
            )}
          </Field>
          <Field label="Barrio">
            {canEdit('barrio') ? (
              hasBarrioCatalog ? (
                <Combobox
                  options={barrioOptions}
                  value={values.barrio ?? ''}
                  placeholder="Seleccionar barrio"
                  searchPlaceholder="Buscar barrio…"
                  className={styles.combobox}
                  onChange={(value) => {
                    if (typeof value !== 'string') return;
                    updateField('barrio', value);
                  }}
                  theme={uiTheme}
                  size="md"
                />
              ) : (
                <RecetaTextInput
                  theme={uiTheme}
                  className={styles.controlMd}
                  placeholder={values.ciudad ? '' : 'Selecciona una ciudad primero'}
                  disabled={!values.ciudad}
                  value={values.barrio ?? ''}
                  onChange={(event) => updateField('barrio', event.target.value)}
                />
              )
            ) : (
              <Readonly value={displayValue(values.barrio)} />
            )}
          </Field>
          {canEdit('direccion') ? (
            <>
              <Field label="Tipo de vía">
                <RecetaFilterSelect
                  theme={uiTheme}
                  size="md"
                  value={values.direccionTipoVia}
                  options={TIPO_VIA_OPTIONS}
                  placeholder="Seleccionar tipo de vía"
                  onChange={(value) => updateField('direccionTipoVia', value)}
                />
              </Field>
              <Field label="Número de vía">
                <RecetaTextInput
                  theme={uiTheme}
                  className={styles.controlMd}
                  placeholder="Ej. 45A"
                  value={values.direccionNumeroVia}
                  onChange={(event) =>
                    updateField('direccionNumeroVia', normalizeDireccionText(event.target.value))
                  }
                />
              </Field>
              <Field label="Número de placa">
                <div className={styles.placaRow}>
                  <RecetaTextInput
                    theme={uiTheme}
                    className={styles.controlMd}
                    aria-label="Número de placa (primera parte)"
                    placeholder="Ej. 12"
                    value={values.direccionPlaca1}
                    onChange={(event) =>
                      updateField('direccionPlaca1', normalizeDireccionText(event.target.value))
                    }
                  />
                  <span className={styles.placaSeparator} aria-hidden="true">
                    -
                  </span>
                  <RecetaTextInput
                    theme={uiTheme}
                    className={styles.controlMd}
                    aria-label="Número de placa (segunda parte)"
                    placeholder="Ej. 34"
                    value={values.direccionPlaca2}
                    onChange={(event) =>
                      updateField('direccionPlaca2', normalizeDireccionText(event.target.value))
                    }
                  />
                </div>
              </Field>
              <Field label="Complemento">
                <RecetaTextInput
                  theme={uiTheme}
                  className={styles.controlMd}
                  placeholder="Apto, torre, interior, oficina…"
                  value={values.direccionComplemento}
                  onChange={(event) =>
                    updateField('direccionComplemento', normalizeDireccionText(event.target.value))
                  }
                />
              </Field>
              <Field label="Vista previa de dirección" className={styles.fieldFull}>
                <Readonly value={direccionPreview || '—'} />
              </Field>
            </>
          ) : (
            <Field label="Dirección" className={styles.fieldFull}>
              <Readonly value={displayValue(values.direccion)} />
            </Field>
          )}
          <Field label="Teléfono" error={errors.telefono}>
            {canEdit('telefono') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.telefono ?? ''}
                onChange={(event) => updateField('telefono', event.target.value.replace(/\D/g, ''))}
              />
            ) : (
              <Readonly value={displayValue(values.telefono)} />
            )}
          </Field>
          <Field label="Correo" error={errors.correo}>
            {canEdit('correo') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                type="email"
                value={values.correo ?? ''}
                onChange={(event) => updateField('correo', event.target.value)}
              />
            ) : (
              <Readonly value={displayValue(values.correo)} />
            )}
          </Field>
        </div>

        <p className={styles.sectionTitle}>Contacto de emergencia</p>
        {!editingPersonal && values && !hasCompleteEmergencyContact(values) ? (
          <p className={styles.pendingBanner} role="status">
            {EMERGENCY_CONTACT_PENDING_MESSAGE}
          </p>
        ) : null}
        <div className={styles.grid}>
          <Field label="Nombre *" error={errors.contactoEmergenciaNombre}>
            {canEdit('contactoEmergenciaNombre') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.contactoEmergenciaNombre ?? ''}
                onChange={(event) => updateField('contactoEmergenciaNombre', event.target.value)}
              />
            ) : (
              <Readonly value={displayValue(values.contactoEmergenciaNombre)} />
            )}
          </Field>
          <Field label="Parentesco *" error={errors.contactoEmergenciaParentesco}>
            {canEdit('contactoEmergenciaParentesco') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.contactoEmergenciaParentesco ?? ''}
                onChange={(event) =>
                  updateField('contactoEmergenciaParentesco', event.target.value)
                }
              />
            ) : (
              <Readonly value={displayValue(values.contactoEmergenciaParentesco)} />
            )}
          </Field>
          <Field label="Teléfono *" error={errors.contactoEmergenciaTelefono}>
            {canEdit('contactoEmergenciaTelefono') ? (
              <RecetaTextInput
                theme={uiTheme}
                className={styles.controlMd}
                value={values.contactoEmergenciaTelefono ?? ''}
                onChange={(event) =>
                  updateField('contactoEmergenciaTelefono', event.target.value.replace(/\D/g, ''))
                }
              />
            ) : (
              <Readonly value={displayValue(values.contactoEmergenciaTelefono)} />
            )}
          </Field>
        </div>

        {editingPersonal ? (
          <div className={styles.actions}>
            <RecetaFormButton
              type="button"
              theme={uiTheme}
              variant="cancel"
              label="Cancelar"
              disabled={submitting}
              onClick={handleCancelPersonal}
            />
            <RecetaFormButton
              type="submit"
              theme={uiTheme}
              label="Guardar cambios"
              disabled={submitting}
            />
          </div>
        ) : null}
      </form>

      {showEmploymentSection ? (
        <section className={styles.employmentSection}>
          <div className={styles.employmentHeader}>
            <p className={styles.sectionTitle}>Datos laborales</p>
            {canEditEmployment && !editingEmployment && employee ? (
              <RecetaFormButton
                type="button"
                theme={theme}
                variant="add"
                label="Editar"
                onClick={() => setEditingEmployment(true)}
              />
            ) : null}
          </div>

          {employeeQuery.isLoading ? (
            <PayrollEmployeeProfileTabLoading />
          ) : employeeQuery.isError || !employee ? (
            <div className={styles.state}>
              <p>No se pudieron cargar los datos laborales.</p>
              <button type="button" onClick={() => void employeeQuery.refetch()}>
                Reintentar
              </button>
            </div>
          ) : editingEmployment ? (
            <PayrollEmployeeForm
              mode="edit"
              initialValues={employee}
              wizardStep="personal"
              sectionScope="employment-only"
              submitting={submittingEmployment}
              onCancel={handleEmploymentCancel}
              onSubmit={(formValues) => void handleEmploymentSubmit(formValues)}
            />
          ) : (
            <>
              <div className={styles.grid}>
                {employmentFields.map((field) => (
                  <Field key={field.label} label={field.label}>
                    <Readonly value={field.value} />
                  </Field>
                ))}
              </div>

              <div className={styles.beneficiariesSection}>
                <p className={styles.sectionTitle}>Beneficiarios</p>
                {employee.beneficiaries && employee.beneficiaries.length > 0 ? (
                  <div className={styles.beneficiaryTable}>
                    <div className={styles.beneficiaryHeader}>
                      <span>Tipo</span>
                      <span>Nombre completo</span>
                      <span>Edad</span>
                    </div>
                    {employee.beneficiaries.map((beneficiary) => (
                      <div key={beneficiary.id} className={styles.beneficiaryRow}>
                        <span>{formatBeneficiaryType(beneficiary.relationshipType)}</span>
                        <span>{beneficiary.fullName}</span>
                        <span>{beneficiary.age}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyHint}>Sin beneficiarios registrados.</p>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function Readonly({ value }: { value: string }): React.JSX.Element {
  return <div className={styles.readonlyValue}>{value}</div>;
}
