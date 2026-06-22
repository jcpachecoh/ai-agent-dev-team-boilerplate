import React, { type JSX } from 'react';

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
  finishedProductId: string;
  onFinishedProductChange: (value: string) => void;
  supplyItemOptions: RecetaWizardSelectOption[];
  batchSize: string;
  onBatchSizeChange: (value: string) => void;
  batchUnit: string;
  onBatchUnitChange: (value: string) => void;
  batchUnitOptions: RecetaWizardSelectOption[];
  packageWeight: string;
  onPackageWeightChange: (value: string) => void;
  estimatedMinutes: string;
  onEstimatedMinutesChange: (value: string) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  versionLabel?: string;
  showVersion?: boolean;
  compact?: boolean;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaRecipeWizardGeneralStep({
  theme = 'dark',
  name,
  onNameChange,
  categoryId,
  onCategoryChange,
  categoryOptions,
  finishedProductId,
  onFinishedProductChange,
  supplyItemOptions,
  batchSize,
  onBatchSizeChange,
  batchUnit,
  onBatchUnitChange,
  batchUnitOptions,
  packageWeight,
  onPackageWeightChange,
  estimatedMinutes,
  onEstimatedMinutesChange,
  isActive,
  onIsActiveChange,
  notes,
  onNotesChange,
  versionLabel,
  showVersion = false,
  compact = false,
  className,
}: RecetaRecipeWizardGeneralStepProps): JSX.Element {
  return (
    <section
      className={[styles.panel, themeClasses[theme], compact && styles.panelCompact, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Datos generales de la receta"
    >
      <h2 className={styles.title}>Datos de la receta</h2>
      <p className={styles.hint}>
        Completa la información base antes de definir las fases del proceso.
      </p>

      <div className={styles.grid}>
        <RecetaWizardField label="Nombre *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ej. Arroz pilaf"
          />
        </RecetaWizardField>

        <RecetaWizardField label="Categoría" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">Sin categoría</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
        </RecetaWizardField>

        <RecetaWizardField label="Producto terminado *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={finishedProductId}
            onChange={(event) => onFinishedProductChange(event.target.value)}
          >
            <option value="">Seleccionar insumo</option>
            {supplyItemOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
        </RecetaWizardField>

        <RecetaWizardField label="Tamaño de lote *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            inputMode="decimal"
            value={batchSize}
            onChange={(event) => onBatchSizeChange(event.target.value)}
            placeholder="Ej. 10"
          />
        </RecetaWizardField>

        <RecetaWizardField label="Unidad del lote *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={batchUnit}
            onChange={(event) => onBatchUnitChange(event.target.value)}
          >
            {batchUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </RecetaWizardSelect>
        </RecetaWizardField>

        <RecetaWizardField label="Peso aprox. por paquete (kg)" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="text"
            inputMode="decimal"
            value={packageWeight}
            onChange={(event) => onPackageWeightChange(event.target.value)}
            placeholder="Ej. 440"
          />
        </RecetaWizardField>

        <RecetaWizardField label="Tiempo estimado (min) *" theme={theme}>
          <RecetaWizardInput
            theme={theme}
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(event) => onEstimatedMinutesChange(event.target.value)}
          />
        </RecetaWizardField>

        <RecetaWizardField label="Estado *" theme={theme}>
          <RecetaWizardSelect
            theme={theme}
            value={isActive ? 'active' : 'inactive'}
            onChange={(event) => onIsActiveChange(event.target.value === 'active')}
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </RecetaWizardSelect>
        </RecetaWizardField>

        {showVersion && versionLabel ? (
          <RecetaWizardField label="Versión" theme={theme}>
            <RecetaWizardInput theme={theme} type="text" value={versionLabel} readOnly />
          </RecetaWizardField>
        ) : null}

        <RecetaWizardField label="Notas" theme={theme} fullWidth>
          <RecetaWizardTextarea
            theme={theme}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Notas de la receta (opcional)"
            rows={3}
          />
        </RecetaWizardField>
      </div>
    </section>
  );
}

export default RecetaRecipeWizardGeneralStep;
