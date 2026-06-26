import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useUiTheme } from '@/hooks/useUiTheme';

import {
  buildCatalogSelectOptions,
  catalogSelectPlaceholder,
  useEmployeeCatalogOptions,
} from '../hooks/useEmployeeCatalogOptions';
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

  const areaOptions = buildCatalogSelectOptions(areaCatalogQuery.data ?? [], areaValue);

  const submitHandler = handleSubmit((values) => {
    onSubmit({
      title: values.title.trim(),
      area: values.area.trim(),
      baseSalaryRange: String(parseEmployeePositionSalary(values.baseSalaryRange)),
      isActive: values.isActive,
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
          <input
            className={styles.input}
            type="number"
            min={1}
            step={1000}
            inputMode="numeric"
            disabled={submitting}
            {...register('baseSalaryRange')}
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
