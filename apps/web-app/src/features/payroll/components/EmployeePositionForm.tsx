import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, Combobox, RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { ThousandsInput } from '@/components/shared/ThousandsInput';

import { useUiTheme } from '@/hooks/useUiTheme';

import {
  buildCatalogSelectOptions,
  catalogSelectPlaceholder,
  useEmployeeCatalogOptions,
} from '../hooks/useEmployeeCatalogOptions';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import { EMPLOYEE_CATALOG_TYPES } from '../types/employee-catalog.types';
import {
  employeePositionToFormValues,
  parseEmployeePositionSalary,
  type EmployeePosition,
  type EmployeePositionFormValues,
} from '../types/employee-position.types';
import {
  employeePositionFormSchema,
  type EmployeePositionFormSchema,
} from '../validation/employeePosition.schema';
import styles from './EmployeePositionForm.module.scss';

export interface EmployeePositionFormProps {
  mode: 'create' | 'edit';
  initialValues?: EmployeePosition;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: EmployeePositionFormValues) => void;
}

const EMPTY_VALUES: EmployeePositionFormValues = {
  title: '',
  area: '',
  baseSalaryRange: '',
  isActive: true,
  supervisorPositionIds: [],
};

export function EmployeePositionForm({
  mode,
  initialValues,
  submitting = false,
  onCancel,
  onSubmit,
}: EmployeePositionFormProps): React.JSX.Element {
  const uiTheme = useUiTheme();
  const areaCatalogQuery = useEmployeeCatalogOptions(EMPLOYEE_CATALOG_TYPES.AREA);
  // includeInactive: true — un supervisor ya asignado puede haberse inactivado después. Se
  // necesita en la respuesta para poder seguir mostrando su título (ver `supervisorOptions`).
  const supervisorOptionsQuery = useEmployeePositions({ includeInactive: true });

  const defaultValues = useMemo<EmployeePositionFormValues>(
    () => (initialValues ? employeePositionToFormValues(initialValues) : EMPTY_VALUES),
    [initialValues],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EmployeePositionFormSchema>({
    resolver: zodResolver(employeePositionFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const areaValue = watch('area');
  const isActive = watch('isActive');
  const supervisorPositionIdsValue = watch('supervisorPositionIds');

  const areaOptions = buildCatalogSelectOptions(areaCatalogQuery.data ?? [], areaValue);

  // Un cargo no puede ser su propio supervisor — se excluye de las opciones en edición.
  // El backend valida lo mismo (y ciclos transitivos) como fuente de verdad; esto solo
  // evita el error más obvio antes de enviar la mutación.
  //
  // Cargos inactivos: se excluyen como opción para NUEVAS asignaciones, pero si un
  // supervisor ya asignado se inactivó después, debe seguir apareciendo (con su título,
  // marcado "(Inactivo)") mientras siga seleccionado — si no, el Combobox no encuentra su
  // label en `options` y termina mostrando el id crudo en el chip.
  const supervisorOptions = useMemo(() => {
    const positions = supervisorOptionsQuery.data ?? [];
    const selectedIds = new Set(supervisorPositionIdsValue ?? []);
    return positions
      .filter((position) => position.id !== initialValues?.id)
      .filter((position) => position.isActive || selectedIds.has(position.id))
      .map((position) => ({
        value: position.id,
        label: position.isActive ? position.title : `${position.title} (Inactivo)`,
      }));
  }, [supervisorOptionsQuery.data, initialValues?.id, supervisorPositionIdsValue]);

  const submitHandler = handleSubmit((values) => {
    onSubmit({
      title: values.title.trim(),
      area: values.area.trim(),
      baseSalaryRange: String(parseEmployeePositionSalary(values.baseSalaryRange)),
      isActive: values.isActive,
      supervisorPositionIds: values.supervisorPositionIds,
    });
  });

  return (
    <form className={styles.form} onSubmit={(event) => void submitHandler(event)} noValidate>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nombre del cargo</span>
          <input
            className={styles.input}
            type="text"
            maxLength={120}
            disabled={submitting}
            {...register('title')}
          />
          {errors.title ? <span className={styles.error}>{errors.title.message}</span> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Área</span>
          <RecetaFilterSelect
            theme={uiTheme}
            size="md"
            className={styles.select}
            value={areaValue}
            onChange={(value) => setValue('area', value, { shouldValidate: true })}
            options={areaOptions}
            placeholder={catalogSelectPlaceholder(
              areaCatalogQuery.isLoading,
              areaOptions.length > 0,
              'Cargando áreas...',
              'No hay áreas configuradas',
              'Seleccionar área',
              areaCatalogQuery.isError,
            )}
            disabled={submitting || areaCatalogQuery.isLoading}
          />
          {errors.area ? <span className={styles.error}>{errors.area.message}</span> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Salario base (COP)</span>
          <Controller
            name="baseSalaryRange"
            control={control}
            render={({ field }) => (
              <ThousandsInput
                className={styles.input}
                placeholder="0"
                disabled={submitting}
                value={field.value}
                onChange={(value) => field.onChange(String(value))}
              />
            )}
          />
          {errors.baseSalaryRange ? (
            <span className={styles.error}>{errors.baseSalaryRange.message}</span>
          ) : null}
        </label>

        {mode === 'edit' ? (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Estado</span>
            <label className={styles.checkboxRow}>
              <Checkbox
                checked={isActive}
                onChange={(checked) => setValue('isActive', checked, { shouldValidate: true })}
                disabled={submitting}
                label=""
              />
              <span>Activo</span>
            </label>
          </div>
        ) : null}

        <div className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>Cargo(s) supervisor(es)</span>
          <Controller
            name="supervisorPositionIds"
            control={control}
            render={({ field }) => (
              <Combobox
                theme={uiTheme}
                size="md"
                multiple
                options={supervisorOptions}
                value={field.value}
                onChange={(value) => field.onChange(Array.isArray(value) ? value : [value])}
                placeholder={
                  supervisorOptionsQuery.isLoading
                    ? 'Cargando cargos...'
                    : 'Seleccionar cargo(s) supervisor(es)'
                }
              />
            )}
          />
          {errors.supervisorPositionIds ? (
            <span className={styles.error}>{errors.supervisorPositionIds.message}</span>
          ) : null}
        </div>
      </div>

      <footer className={styles.footer}>
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
            submitting ? 'Guardando...' : mode === 'create' ? 'Crear cargo' : 'Guardar cambios'
          }
          type="submit"
          theme={uiTheme}
          disabled={submitting}
        />
      </footer>
    </form>
  );
}
