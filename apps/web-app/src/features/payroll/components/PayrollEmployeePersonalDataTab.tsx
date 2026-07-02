import {
  EmpleadoAvatar,
  RecetaFilterSelect,
  RecetaFormButton,
  RecetaTextInput,
  resolveEmpleadoInitials,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';

import {
  getColombiaCities,
  getColombiaDepartments,
  updateEmployeePersonalData,
} from '../api/personal-data.client';
import { useEmployeePersonalDataQuery } from '../hooks/useEmployeePersonalDataQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type {
  EmployeePersonalData,
  PersonalDataFieldKey,
  UpdateEmployeePersonalDataInput,
} from '../types/personal-data.types';
import { PayrollApiError } from '../api/payroll.client';
import { EmployeePhotoUploader } from './EmployeePhotoUploader';
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

function toFormState(data: EmployeePersonalData): UpdateEmployeePersonalDataInput {
  return {
    tipoDocumento: data.tipoDocumento ?? '',
    numeroDocumento: data.numeroDocumento ?? '',
    nombres: data.nombres ?? '',
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
    telefono: data.telefono ?? '',
    correo: data.correo ?? '',
    contactoEmergenciaNombre: data.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: data.contactoEmergenciaTelefono ?? '',
    contactoEmergenciaParentesco: data.contactoEmergenciaParentesco ?? '',
    profilePhotoStorageObjectId: data.profilePhotoStorageObjectId,
  };
}

function validateForm(values: UpdateEmployeePersonalDataInput): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!values.tipoDocumento) errors.tipoDocumento = 'Requerido';
  if (!values.numeroDocumento || !/^\d{1,15}$/.test(values.numeroDocumento)) {
    errors.numeroDocumento = 'Solo números, máx. 15 dígitos';
  }
  if (!values.nombres?.trim()) errors.nombres = 'Requerido';
  if (!values.primerApellido?.trim()) errors.primerApellido = 'Requerido';
  if (!values.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo)) {
    errors.correo = 'Correo inválido';
  }
  if (values.telefono && !/^\d{7,15}$/.test(values.telefono)) {
    errors.telefono = 'Entre 7 y 15 dígitos';
  }
  if (values.contactoEmergenciaTelefono && !/^\d{7,15}$/.test(values.contactoEmergenciaTelefono)) {
    errors.contactoEmergenciaTelefono = 'Entre 7 y 15 dígitos';
  }
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
}

export function PayrollEmployeePersonalDataTab({
  userId,
  theme,
}: PayrollEmployeePersonalDataTabProps): React.JSX.Element {
  const uiTheme = useUiTheme();
  const query = useEmployeePersonalDataQuery(userId);
  const employeeQuery = usePayrollEmployeeQuery(userId);
  const [values, setValues] = useState<UpdateEmployeePersonalDataInput | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<Array<{ value: string; label: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const canEdit = (field: PersonalDataFieldKey) => editable.has(field);

  const fullName = [values?.nombres, values?.primerApellido, values?.segundoApellido]
    .filter(Boolean)
    .join(' ');

  const updateField = <K extends keyof UpdateEmployeePersonalDataInput>(
    key: K,
    value: UpdateEmployeePersonalDataInput[K],
  ) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key === 'departamento') {
      setValues((current) => (current ? { ...current, ciudad: '' } : current));
    }
  };

  const handleSubmit = async () => {
    if (!values) return;
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: UpdateEmployeePersonalDataInput = {
        ...values,
        estadoCivil: values.estadoCivil || undefined,
        sexo: values.sexo || undefined,
        telefono: values.telefono?.trim() || undefined,
        contactoEmergenciaTelefono: values.contactoEmergenciaTelefono?.trim() || undefined,
      };

      await updateEmployeePersonalData(userId, payload);
      toast.success('Datos personales guardados');
      await query.refetch();
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudieron guardar los datos';
      toast.error(message);
    } finally {
      setSubmitting(false);
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

  const employee = employeeQuery.data;

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className={styles.photoRow}>
        {employee && canEdit('profilePhotoStorageObjectId') ? (
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
        <Field label="Nombres" error={errors.nombres}>
          {canEdit('nombres') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.nombres ?? ''}
              onChange={(event) => updateField('nombres', event.target.value)}
            />
          ) : (
            <Readonly value={displayValue(values.nombres)} />
          )}
        </Field>
        <Field label="Primer apellido" error={errors.primerApellido}>
          {canEdit('primerApellido') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.primerApellido ?? ''}
              onChange={(event) => updateField('primerApellido', event.target.value)}
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
              onChange={(event) => updateField('segundoApellido', event.target.value)}
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
                updateField('estadoCivil', value as UpdateEmployeePersonalDataInput['estadoCivil'])
              }
            />
          ) : (
            <Readonly value={displayValue(values.estadoCivil)} />
          )}
        </Field>
        <Field label="Sexo">
          {canEdit('sexo') ? (
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              value={values.sexo ?? ''}
              options={GENDER_OPTIONS}
              onChange={(value) =>
                updateField('sexo', value as UpdateEmployeePersonalDataInput['sexo'])
              }
            />
          ) : (
            <Readonly value={displayValue(values.sexo)} />
          )}
        </Field>
      </div>

      <p className={styles.sectionTitle}>Ubicación y contacto</p>
      <div className={styles.grid}>
        <Field label="Departamento">
          {canEdit('departamento') ? (
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              value={values.departamento ?? ''}
              options={departments}
              onChange={(value) => updateField('departamento', value)}
            />
          ) : (
            <Readonly value={displayValue(values.departamento)} />
          )}
        </Field>
        <Field label="Ciudad">
          {canEdit('ciudad') ? (
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              value={values.ciudad ?? ''}
              options={cities}
              onChange={(value) => updateField('ciudad', value)}
              disabled={!values.departamento}
            />
          ) : (
            <Readonly value={displayValue(values.ciudad)} />
          )}
        </Field>
        <Field label="Localidad">
          {canEdit('localidad') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.localidad ?? ''}
              onChange={(event) => updateField('localidad', event.target.value)}
            />
          ) : (
            <Readonly value={displayValue(values.localidad)} />
          )}
        </Field>
        <Field label="Barrio">
          {canEdit('barrio') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.barrio ?? ''}
              onChange={(event) => updateField('barrio', event.target.value)}
            />
          ) : (
            <Readonly value={displayValue(values.barrio)} />
          )}
        </Field>
        <Field label="Dirección" className={styles.fieldFull}>
          {canEdit('direccion') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.direccion ?? ''}
              onChange={(event) => updateField('direccion', event.target.value)}
            />
          ) : (
            <Readonly value={displayValue(values.direccion)} />
          )}
        </Field>
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
      <div className={styles.grid}>
        <Field label="Nombre">
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
        <Field label="Parentesco">
          {canEdit('contactoEmergenciaParentesco') ? (
            <RecetaTextInput
              theme={uiTheme}
              className={styles.controlMd}
              value={values.contactoEmergenciaParentesco ?? ''}
              onChange={(event) => updateField('contactoEmergenciaParentesco', event.target.value)}
            />
          ) : (
            <Readonly value={displayValue(values.contactoEmergenciaParentesco)} />
          )}
        </Field>
        <Field label="Teléfono" error={errors.contactoEmergenciaTelefono}>
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

      <div className={styles.actions}>
        <RecetaFormButton
          type="submit"
          theme={uiTheme}
          label="Guardar cambios"
          disabled={submitting}
        />
      </div>
    </form>
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
