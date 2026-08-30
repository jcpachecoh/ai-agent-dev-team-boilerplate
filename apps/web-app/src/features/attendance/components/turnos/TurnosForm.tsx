import { zodResolver } from '@hookform/resolvers/zod';
import { InventarioFormField, RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useUiTheme } from '@/hooks/useUiTheme';

import { useAttendanceScopeLocations } from '../../hooks/useAttendanceScopeLocations';
import type { Turno, TurnoFormValues } from '../../types/turnos.types';
import { TURNO_DAY_OPTIONS } from '../../utils/format-turno-days';
import {
  crossesMidnight,
  turnoFormSchema,
  type TurnoFormSchema,
} from '../../validation/turno.schema';
import styles from './TurnosForm.module.scss';

const TIPO_OPTIONS = [
  { value: 'PERMANENTE', label: 'Permanente' },
  { value: 'VARIABLE', label: 'Variable' },
] as const;

const JORNADA_OPTIONS = [
  { value: 'DIURNO', label: 'Diurno' },
  { value: 'NOCTURNO', label: 'Nocturno' },
  { value: 'MIXTO', label: 'Mixto' },
] as const;

const EMPTY_VALUES: TurnoFormValues = {
  locationId: '',
  nombre: '',
  sigla: '',
  tipo: 'PERMANENTE',
  jornada: 'DIURNO',
  horaInicio: '06:00',
  horaFin: '14:00',
  daysOfWeek: [1, 2, 3, 4, 5],
};

function turnoToFormValues(turno: Turno): TurnoFormValues {
  return {
    locationId: turno.locationId,
    nombre: turno.nombre,
    sigla: turno.sigla,
    tipo: turno.tipo,
    jornada: turno.jornada,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    daysOfWeek: turno.daysOfWeek,
  };
}

export interface TurnosFormProps {
  mode: 'create' | 'edit';
  initialValues?: Turno;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: TurnoFormValues) => void;
}

export function TurnosForm({
  mode,
  initialValues,
  submitting = false,
  onCancel,
  onSubmit,
}: TurnosFormProps): React.JSX.Element {
  const uiTheme = useUiTheme();
  const { locations } = useAttendanceScopeLocations();

  const defaultValues = useMemo<TurnoFormValues>(
    () =>
      initialValues
        ? turnoToFormValues(initialValues)
        : { ...EMPTY_VALUES, locationId: locations[0]?.id ?? '' },
    [initialValues, locations],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TurnoFormSchema>({
    resolver: zodResolver(turnoFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');
  const tipo = watch('tipo');
  const jornada = watch('jornada');
  const locationId = watch('locationId');
  const daysOfWeek = watch('daysOfWeek');
  const midnightWarning = crossesMidnight(horaInicio, horaFin);

  const toggleDay = (day: number): void => {
    const current = new Set(daysOfWeek);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    setValue(
      'daysOfWeek',
      [...current].sort((a, b) => a - b),
      { shouldValidate: true },
    );
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.grid}>
        <div className={styles.fieldGroup}>
          <InventarioFormField
            label="Sede"
            inputType="select"
            bareControl
            theme={uiTheme}
            size="md"
          >
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              className={styles.select}
              value={locationId}
              options={locations.map((location) => ({ value: location.id, label: location.name }))}
              onChange={(value) => setValue('locationId', value, { shouldValidate: true })}
              disabled={submitting}
            />
          </InventarioFormField>
          {errors.locationId ? (
            <span className={styles.error}>{errors.locationId.message}</span>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField label="Nombre" theme={uiTheme} size="md">
            <input
              className={styles.controlInput}
              type="text"
              maxLength={100}
              disabled={submitting}
              {...register('nombre')}
            />
          </InventarioFormField>
          {errors.nombre ? <span className={styles.error}>{errors.nombre.message}</span> : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField label="Sigla" theme={uiTheme} size="md">
            <input
              className={styles.controlInput}
              type="text"
              maxLength={30}
              disabled={submitting}
              {...register('sigla')}
            />
          </InventarioFormField>
          {errors.sigla ? <span className={styles.error}>{errors.sigla.message}</span> : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField
            label="Tipo"
            inputType="select"
            bareControl
            theme={uiTheme}
            size="md"
          >
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              className={styles.select}
              value={tipo}
              options={TIPO_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={(value) =>
                setValue('tipo', value as TurnoFormValues['tipo'], { shouldValidate: true })
              }
              disabled={submitting}
            />
          </InventarioFormField>
          {errors.tipo ? <span className={styles.error}>{errors.tipo.message}</span> : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField
            label="Jornada"
            inputType="select"
            bareControl
            theme={uiTheme}
            size="md"
          >
            <RecetaFilterSelect
              theme={uiTheme}
              size="md"
              className={styles.select}
              value={jornada}
              options={JORNADA_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(value) =>
                setValue('jornada', value as TurnoFormValues['jornada'], { shouldValidate: true })
              }
              disabled={submitting}
            />
          </InventarioFormField>
          {errors.jornada ? <span className={styles.error}>{errors.jornada.message}</span> : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField label="Hora inicio" theme={uiTheme} size="md">
            <input
              className={styles.controlInput}
              type="time"
              disabled={submitting}
              {...register('horaInicio')}
            />
          </InventarioFormField>
          {errors.horaInicio ? (
            <span className={styles.error}>{errors.horaInicio.message}</span>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <InventarioFormField label="Hora fin" theme={uiTheme} size="md">
            <input
              className={styles.controlInput}
              type="time"
              disabled={submitting}
              {...register('horaFin')}
            />
          </InventarioFormField>
          {errors.horaFin ? <span className={styles.error}>{errors.horaFin.message}</span> : null}
        </div>

        <div className={`${styles.fieldGroup} ${styles.daysGroup}`}>
          <span className={styles.daysLabel}>Días de la semana *</span>
          <div className={styles.daysRow} role="group" aria-label="Días de la semana">
            {TURNO_DAY_OPTIONS.map((day) => (
              <label key={day.value} className={styles.dayToggle}>
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(day.value)}
                  disabled={submitting}
                  onChange={() => toggleDay(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
          {errors.daysOfWeek ? (
            <span className={styles.error}>{errors.daysOfWeek.message}</span>
          ) : null}
        </div>
      </div>

      {midnightWarning ? (
        <p className={styles.warning} role="status">
          Este turno cruza medianoche. Se permitirá guardar, pero verifica que el horario sea
          correcto.
        </p>
      ) : null}

      <div className={styles.actions}>
        <RecetaFormButton
          variant="cancel"
          label="Cancelar"
          type="button"
          theme={uiTheme}
          onClick={onCancel}
          disabled={submitting}
        />
        <RecetaFormButton
          variant="save"
          label={
            submitting ? 'Guardando...' : mode === 'create' ? 'Crear turno' : 'Guardar cambios'
          }
          type="submit"
          theme={uiTheme}
          disabled={submitting}
        />
      </div>
    </form>
  );
}
