import { Checkbox, RecetaFilterSelect } from '@restopsiq/ui';

import type { UiTheme } from '@/constants/theme';
import {
  getEquipmentOptionsForPhaseType,
  RECIPE_PROCESS_PHASE_TYPE_OPTIONS,
  RECIPE_REJECTION_CRITERION_OPTIONS,
  SHELF_LIFE_UNIT_OPTIONS,
  STORAGE_CONDITION_OPTIONS,
} from '@/features/recetas/constants/recipePhaseCatalogs';
import { combineHoursAndMinutes } from '@/features/recetas/mappers/phases.mapper';
import type {
  RecipeCompositionRow,
  RecipePhaseEquipment,
  RecipePhaseFormRow,
  RecipeProcessPhaseType,
  RecipeRejectionCriterion,
  ShelfLifeUnit,
  StorageCondition,
} from '@/features/recetas/types';

import styles from './RecipePhaseFormFields.module.scss';

interface RecipePhaseFormFieldsProps {
  row: RecipePhaseFormRow;
  compositionRows: RecipeCompositionRow[];
  theme: UiTheme;
  readOnly?: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (patch: Partial<RecipePhaseFormRow>) => void;
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function RecipePhaseFormFields({
  row,
  compositionRows,
  theme,
  readOnly = false,
  fieldErrors = {},
  onChange,
}: RecipePhaseFormFieldsProps) {
  const equipmentOptions = getEquipmentOptionsForPhaseType(row.phaseType);
  const compositionOptions = compositionRows.map((line) => ({
    value: line.id,
    label: line.supplyItemName
      ? `${line.supplyItemCode} — ${line.supplyItemName}`
      : line.supplyItemCode || 'Insumo sin nombre',
  }));

  const updateTime = (hours: string, minutes: string): void => {
    onChange({
      timeHours: hours,
      timeMinutes: minutes,
      standardMinutes: Math.max(1, combineHoursAndMinutes(hours, minutes) || 0),
    });
  };

  return (
    <div className={styles.grid}>
      <label className={styles.field}>
        <span className={styles.label}>Fase *</span>
        {readOnly ? (
          <span className={styles.readonly}>
            {RECIPE_PROCESS_PHASE_TYPE_OPTIONS.find((option) => option.value === row.phaseType)
              ?.label ?? '—'}
          </span>
        ) : (
          <>
            <RecetaFilterSelect
              theme={theme}
              size="md"
              value={row.phaseType}
              placeholder="Seleccionar fase"
              options={RECIPE_PROCESS_PHASE_TYPE_OPTIONS}
              onChange={(value) => onChange({ phaseType: value as RecipeProcessPhaseType })}
            />
            {fieldErrors.phaseType ? (
              <span className={styles.error}>{fieldErrors.phaseType}</span>
            ) : null}
          </>
        )}
      </label>

      <div className={styles.field}>
        <span className={styles.label}>Tiempo estándar *</span>
        {readOnly ? (
          <span className={styles.readonly}>{row.standardMinutes} min</span>
        ) : (
          <div className={styles.timeRow}>
            <input
              className={styles.input}
              type="number"
              min={0}
              placeholder="Horas"
              value={row.timeHours}
              onChange={(event) => updateTime(event.target.value, row.timeMinutes)}
            />
            <span className={styles.timeSep}>h</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={59}
              placeholder="Min"
              value={row.timeMinutes}
              onChange={(event) => updateTime(row.timeHours, event.target.value)}
            />
            <span className={styles.timeSep}>min</span>
          </div>
        )}
        {fieldErrors.standardMinutes ? (
          <span className={styles.error}>{fieldErrors.standardMinutes}</span>
        ) : null}
      </div>

      <div className={[styles.field, styles.fieldFull].join(' ')}>
        <span className={styles.label}>Insumos</span>
        {compositionRows.length === 0 ? (
          <p className={styles.hint}>Registra insumos en Composición primero.</p>
        ) : readOnly ? (
          <span className={styles.readonly}>
            {row.compositionLineIds.length > 0
              ? compositionOptions
                  .filter((option) => row.compositionLineIds.includes(option.value))
                  .map((option) => option.label)
                  .join(', ')
              : '—'}
          </span>
        ) : (
          <div className={styles.checkboxList}>
            {compositionOptions.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={row.compositionLineIds.includes(option.value)}
                onChange={() =>
                  onChange({
                    compositionLineIds: toggleValue(row.compositionLineIds, option.value),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className={[styles.field, styles.fieldFull].join(' ')}>
        <span className={styles.label}>Utensilios y equipos</span>
        {readOnly ? (
          <span className={styles.readonly}>
            {row.equipment.length > 0
              ? equipmentOptions
                  .filter((option) => row.equipment.includes(option.value))
                  .map((option) => option.label)
                  .join(', ')
              : '—'}
          </span>
        ) : (
          <div className={styles.checkboxList}>
            {equipmentOptions.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={row.equipment.includes(option.value)}
                disabled={!row.phaseType}
                onChange={() =>
                  onChange({
                    equipment: toggleValue(row.equipment, option.value as RecipePhaseEquipment),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Gramaje final</span>
        {readOnly ? (
          <span className={styles.readonly}>{row.finalWeight || '—'}</span>
        ) : (
          <input
            className={styles.input}
            inputMode="decimal"
            placeholder="0.00"
            value={row.finalWeight}
            onChange={(event) => onChange({ finalWeight: event.target.value })}
          />
        )}
        {fieldErrors.finalWeight ? (
          <span className={styles.error}>{fieldErrors.finalWeight}</span>
        ) : null}
      </label>

      {row.phaseType === 'PACKAGING' ? (
        <label className={styles.field}>
          <span className={styles.label}>Empaque requerido *</span>
          {readOnly ? (
            <span className={styles.readonly}>{row.requiredPackaging || '—'}</span>
          ) : (
            <input
              className={styles.input}
              maxLength={100}
              placeholder="Describe el empaque"
              value={row.requiredPackaging}
              onChange={(event) => onChange({ requiredPackaging: event.target.value })}
            />
          )}
          {fieldErrors.requiredPackaging ? (
            <span className={styles.error}>{fieldErrors.requiredPackaging}</span>
          ) : null}
        </label>
      ) : null}

      {row.phaseType === 'COLD_STORAGE' ? (
        <>
          <label className={styles.field}>
            <span className={styles.label}>Vida útil *</span>
            {readOnly ? (
              <span className={styles.readonly}>
                {row.shelfLifeValue
                  ? `${row.shelfLifeValue} ${
                      SHELF_LIFE_UNIT_OPTIONS.find((option) => option.value === row.shelfLifeUnit)
                        ?.label ?? ''
                    }`
                  : '—'}
              </span>
            ) : (
              <div className={styles.timeRow}>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  placeholder="Valor"
                  value={row.shelfLifeValue}
                  onChange={(event) => onChange({ shelfLifeValue: event.target.value })}
                />
                <RecetaFilterSelect
                  theme={theme}
                  size="md"
                  className={styles.shelfUnit}
                  value={row.shelfLifeUnit}
                  placeholder="Unidad"
                  options={SHELF_LIFE_UNIT_OPTIONS}
                  onChange={(value) => onChange({ shelfLifeUnit: value as ShelfLifeUnit })}
                />
              </div>
            )}
            {fieldErrors.shelfLifeValue ? (
              <span className={styles.error}>{fieldErrors.shelfLifeValue}</span>
            ) : null}
            {fieldErrors.shelfLifeUnit ? (
              <span className={styles.error}>{fieldErrors.shelfLifeUnit}</span>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Condición de almacenamiento *</span>
            {readOnly ? (
              <span className={styles.readonly}>
                {STORAGE_CONDITION_OPTIONS.find((option) => option.value === row.storageCondition)
                  ?.label ?? '—'}
              </span>
            ) : (
              <RecetaFilterSelect
                theme={theme}
                size="md"
                value={row.storageCondition}
                placeholder="Seleccionar"
                options={STORAGE_CONDITION_OPTIONS}
                onChange={(value) => onChange({ storageCondition: value as StorageCondition })}
              />
            )}
            {fieldErrors.storageCondition ? (
              <span className={styles.error}>{fieldErrors.storageCondition}</span>
            ) : null}
          </label>
        </>
      ) : null}

      <div className={[styles.field, styles.fieldFull].join(' ')}>
        <span className={styles.label}>Criterios de rechazo</span>
        {readOnly ? (
          <span className={styles.readonly}>
            {row.rejectionCriteria.length > 0
              ? RECIPE_REJECTION_CRITERION_OPTIONS.filter((option) =>
                  row.rejectionCriteria.includes(option.value),
                )
                  .map((option) => option.label)
                  .join(', ')
              : '—'}
          </span>
        ) : (
          <div className={styles.checkboxList}>
            {RECIPE_REJECTION_CRITERION_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={row.rejectionCriteria.includes(option.value)}
                onChange={() =>
                  onChange({
                    rejectionCriteria: toggleValue(
                      row.rejectionCriteria,
                      option.value as RecipeRejectionCriterion,
                    ),
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
