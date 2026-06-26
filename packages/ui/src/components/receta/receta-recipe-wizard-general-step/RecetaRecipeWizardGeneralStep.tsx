import React, { type JSX } from 'react';

import { RecetaFilterSelect } from '../receta-filter-select/RecetaFilterSelect';
import { RecetaStatusButton } from '../receta-status-button/RecetaStatusButton';
import {
  RecetaWizardField,
  RecetaWizardInput,
  RecetaWizardSelect,
  RecetaWizardTextarea,
} from '../receta-wizard-field/RecetaWizardField';
import type { RecetaTheme } from '../shared/receta-types';
import type { RecetaWizardSelectOption } from '../shared/receta-wizard-types';
import styles from './RecetaRecipeWizardGeneralStep.module.scss';

export interface RecetaRecipeWizardGeneralStepProps {
  theme?: RecetaTheme;
  name: string;
  onNameChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: RecetaWizardSelectOption[];
  categoryLoading?: boolean;
  categoryError?: string | null;
  onRetryCategories?: () => void;
  recipeCode?: string;
  recipeCodePlaceholder?: string;
  recipeType: string;
  onRecipeTypeChange: (value: string) => void;
  recipeTypeOptions: RecetaWizardSelectOption[];
  finishedProductId: string;
  onFinishedProductChange: (value: string) => void;
  supplyItemOptions: RecetaWizardSelectOption[];
  batchSize: string;
  onBatchSizeChange: (value: string) => void;
  batchDisplayUnit: string;
  onBatchDisplayUnitChange: (value: string) => void;
  batchDisplayUnitOptions: RecetaWizardSelectOption[];
  packageWeightGrams: string;
  onPackageWeightGramsChange: (value: string) => void;
  expectedYield: string;
  onExpectedYieldChange: (value: string) => void;
  expectedYieldUnit: string;
  onExpectedYieldUnitChange: (value: string) => void;
  estimatedHours: string;
  onEstimatedHoursChange: (value: string) => void;
  estimatedMinutes: string;
  onEstimatedMinutesChange: (value: string) => void;
  lifecycleStatusLabel: string;
  operationCenter: string;
  onOperationCenterChange: (value: string) => void;
  operationCenterOptions: RecetaWizardSelectOption[];
  locationIds: string[];
  onLocationToggle: (locationId: string, checked: boolean) => void;
  locationOptions: RecetaWizardSelectOption[];
  locationsLoading?: boolean;
  technicalResponsible: string;
  onTechnicalResponsibleChange: (value: string) => void;
  technicalResponsibleOptions: RecetaWizardSelectOption[];
  selectedAllergens: string[];
  onAllergenToggle: (allergen: string, checked: boolean) => void;
  allergenOptions: RecetaWizardSelectOption[];
  createdAtLabel: string;
  notes: string;
  onNotesChange: (value: string) => void;
  fieldErrors?: Partial<Record<string, string>>;
  extraContent?: React.ReactNode;
  onSaveDraft?: () => void;
  savingDraft?: boolean;
  compact?: boolean;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

function FieldError({ message }: { message?: string }): JSX.Element | null {
  if (!message) {
    return null;
  }
  return (
    <span className={styles.fieldError} role="alert">
      {message}
    </span>
  );
}

export function RecetaRecipeWizardGeneralStep({
  theme = 'dark',
  name,
  onNameChange,
  categoryId,
  onCategoryChange,
  categoryOptions,
  categoryLoading = false,
  categoryError = null,
  onRetryCategories,
  recipeCode,
  recipeCodePlaceholder = 'Se generará al guardar',
  recipeType,
  onRecipeTypeChange,
  recipeTypeOptions,
  finishedProductId,
  onFinishedProductChange,
  supplyItemOptions,
  batchSize,
  onBatchSizeChange,
  batchDisplayUnit,
  onBatchDisplayUnitChange,
  batchDisplayUnitOptions,
  packageWeightGrams,
  onPackageWeightGramsChange,
  expectedYield,
  onExpectedYieldChange,
  expectedYieldUnit,
  onExpectedYieldUnitChange,
  estimatedHours,
  onEstimatedHoursChange,
  estimatedMinutes,
  onEstimatedMinutesChange,
  lifecycleStatusLabel,
  operationCenter,
  onOperationCenterChange,
  operationCenterOptions,
  locationIds,
  onLocationToggle,
  locationOptions,
  locationsLoading = false,
  technicalResponsible,
  onTechnicalResponsibleChange,
  technicalResponsibleOptions,
  selectedAllergens,
  onAllergenToggle,
  allergenOptions,
  createdAtLabel,
  notes,
  onNotesChange,
  fieldErrors,
  extraContent,
  onSaveDraft,
  savingDraft = false,
  compact = false,
  className,
}: RecetaRecipeWizardGeneralStepProps): JSX.Element {
  const showLocations = operationCenter === 'LOCATION';

  return (
    <section
      className={[styles.panel, themeClasses[theme], compact && styles.panelCompact, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Datos generales de la receta"
    >
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Datos de la receta</h2>
          <p className={styles.hint}>
            Completa la información base antes de definir las fases del proceso.
          </p>
        </div>
        {onSaveDraft ? (
          <button
            type="button"
            className={styles.draftButton}
            onClick={onSaveDraft}
            disabled={savingDraft}
          >
            {savingDraft ? 'Guardando borrador...' : 'Guardar borrador'}
          </button>
        ) : null}
      </div>

      {categoryError ? (
        <div className={styles.catalogError}>
          <p>{categoryError}</p>
          {onRetryCategories ? (
            <button type="button" className={styles.retryButton} onClick={onRetryCategories}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.grid}>
        <RecetaWizardField label="Categoría *" theme={theme}>
          {categoryLoading ? (
            <div className={styles.skeleton} aria-hidden />
          ) : (
            <RecetaWizardSelect
              theme={theme}
              value={categoryId}
              onChange={(event) => onCategoryChange(event.target.value)}
              aria-label="Categoría de la receta"
              aria-describedby={fieldErrors?.categoryId ? 'category-error' : undefined}
            >
              <option value="">Seleccionar categoría</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </RecetaWizardSelect>
          )}
          <FieldError message={fieldErrors?.categoryId} />
        </RecetaWizardField>

        <RecetaWizardField label="Código de receta" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            value={recipeCode ?? ''}
            placeholder={recipeCodePlaceholder}
            readOnly
            aria-label="Código de receta"
          />
        </RecetaWizardField>

        <RecetaWizardField label="Tipo de receta *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={recipeType}
            onChange={(event) => onRecipeTypeChange(event.target.value)}
            aria-label="Tipo de receta"
          >
            <option value="">Seleccionar tipo</option>
            {recipeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
          <FieldError message={fieldErrors?.recipeType} />
        </RecetaWizardField>

        <RecetaWizardField label="Nombre de receta *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            value={name}
            maxLength={150}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ej. Arroz pilaf"
            aria-label="Nombre de receta"
          />
          <FieldError message={fieldErrors?.name} />
        </RecetaWizardField>

        <RecetaWizardField label="Producto terminado *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={finishedProductId}
            onChange={(event) => onFinishedProductChange(event.target.value)}
            aria-label="Producto terminado"
          >
            <option value="">Seleccionar insumo</option>
            {supplyItemOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
          <FieldError message={fieldErrors?.finishedProductId} />
        </RecetaWizardField>

        <RecetaWizardField label="Tamaño de lote *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            inputMode="decimal"
            value={batchSize}
            onChange={(event) => onBatchSizeChange(event.target.value)}
            placeholder="Ej. 10"
            aria-label="Tamaño de lote"
          />
          <FieldError message={fieldErrors?.batchSize} />
        </RecetaWizardField>

        <RecetaWizardField label="Unidad de lote *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={batchDisplayUnit}
            onChange={(event) => onBatchDisplayUnitChange(event.target.value)}
            aria-label="Unidad de lote"
          >
            <option value="">Seleccionar unidad</option>
            {batchDisplayUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
          <FieldError message={fieldErrors?.batchDisplayUnit} />
        </RecetaWizardField>

        <RecetaWizardField label="Peso aprox. por lote (g) *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={packageWeightGrams}
            onChange={(event) => onPackageWeightGramsChange(event.target.value)}
            placeholder="Ej. 440"
            aria-label="Peso aproximado por lote en gramos"
          />
          <FieldError message={fieldErrors?.packageWeightGrams} />
        </RecetaWizardField>

        <RecetaWizardField label="Rendimiento esperado *" theme={theme}>
          <div className={styles.inlinePair}>
            <RecetaWizardInput
              theme={theme}
              type="text"
              inputMode="decimal"
              value={expectedYield}
              onChange={(event) => onExpectedYieldChange(event.target.value)}
              placeholder="Ej. 10"
              aria-label="Cantidad de rendimiento esperado"
            />
            <RecetaWizardInput
              theme={theme}
              type="text"
              value={expectedYieldUnit}
              onChange={(event) => onExpectedYieldUnitChange(event.target.value)}
              placeholder="porciones"
              aria-label="Unidad de rendimiento esperado"
            />
          </div>
          <FieldError message={fieldErrors?.expectedYield ?? fieldErrors?.expectedYieldUnit} />
        </RecetaWizardField>

        <RecetaWizardField label="Tiempo estimado *" theme={theme}>
          <div className={styles.inlinePair}>
            <RecetaWizardInput
              theme={theme}
              type="number"
              min={0}
              value={estimatedHours}
              onChange={(event) => onEstimatedHoursChange(event.target.value)}
              placeholder="Horas"
              aria-label="Horas estimadas"
            />
            <RecetaWizardInput
              theme={theme}
              type="number"
              min={0}
              max={59}
              value={estimatedMinutes}
              onChange={(event) => onEstimatedMinutesChange(event.target.value)}
              placeholder="Minutos"
              aria-label="Minutos estimados"
            />
          </div>
          <FieldError message={fieldErrors?.estimatedMinutes} />
        </RecetaWizardField>

        <RecetaWizardField label="Estado" theme={theme}>
          <div className={styles.statusBadgeWrap}>
            <RecetaStatusButton
              theme={theme}
              size="md"
              status="inactive"
              label={lifecycleStatusLabel}
              disabled
              tabIndex={-1}
            />
          </div>
        </RecetaWizardField>

        <RecetaWizardField label="Centro de operación *" theme={theme}>
          <RecetaFilterSelect
            theme={theme}
            size="md"
            value={operationCenter}
            onChange={onOperationCenterChange}
            options={operationCenterOptions}
            placeholder="Seleccionar centro"
            aria-label="Centro de operación"
          />
          <FieldError message={fieldErrors?.operationCenter} />
        </RecetaWizardField>

        {showLocations ? (
          <RecetaWizardField label="Sedes *" theme={theme} fullWidth>
            {locationsLoading ? (
              <div className={styles.skeleton} aria-hidden />
            ) : locationOptions.length === 0 ? (
              <p className={styles.emptyHint}>No hay sedes configuradas para este tenant.</p>
            ) : (
              <ul className={styles.checkboxList} aria-label="Sedes de operación">
                {locationOptions.map((option) => {
                  const checked = locationIds.includes(option.value);
                  return (
                    <li key={option.value}>
                      <label className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => onLocationToggle(option.value, event.target.checked)}
                        />
                        <span>{option.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <FieldError message={fieldErrors?.locationIds} />
          </RecetaWizardField>
        ) : null}

        <RecetaWizardField label="Responsable técnico *" theme={theme}>
          <RecetaFilterSelect
            theme={theme}
            size="md"
            value={technicalResponsible}
            onChange={onTechnicalResponsibleChange}
            options={technicalResponsibleOptions}
            placeholder="Seleccionar responsable"
            aria-label="Responsable técnico"
          />
          <FieldError message={fieldErrors?.technicalResponsible} />
        </RecetaWizardField>

        <RecetaWizardField label="Fecha de creación" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            value={createdAtLabel}
            readOnly
            aria-label="Fecha de creación"
          />
        </RecetaWizardField>

        <RecetaWizardField label="Alérgenos" theme={theme} fullWidth>
          <ul className={styles.checkboxList} aria-label="Alérgenos de la receta">
            {allergenOptions.map((option) => {
              const checked = selectedAllergens.includes(option.value);
              return (
                <li key={option.value}>
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onAllergenToggle(option.value, event.target.checked)}
                    />
                    <span>{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </RecetaWizardField>

        <RecetaWizardField label="Notas" theme={theme} fullWidth>
          <RecetaWizardTextarea
            theme={theme}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Notas de la receta (opcional)"
            rows={3}
            maxLength={500}
            aria-label="Notas de la receta"
          />
          <FieldError message={fieldErrors?.notes} />
        </RecetaWizardField>
      </div>
      {extraContent}
    </section>
  );
}

export default RecetaRecipeWizardGeneralStep;
