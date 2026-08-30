import React, { type JSX } from 'react';

import { RecetaCategoryChip } from '../receta-category-chip/RecetaCategoryChip';
import { RecetaStatusButton } from '../receta-status-button/RecetaStatusButton';
import { RecetaStepCard } from '../receta-step-card/RecetaStepCard';
import type { RecetaTheme } from '../shared/receta-types';
import type { RecetaRecipeWizardPhaseItem } from '../receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep';
import styles from './RecetaRecipeWizardReviewStep.module.scss';

export interface RecetaRecipeWizardReviewStepProps {
  theme?: RecetaTheme;
  name: string;
  categoryLabel?: string;
  finishedProductLabel?: string;
  batchLabel: string;
  packageWeightLabel?: string;
  estimatedMinutes: number;
  isActive: boolean;
  notes?: string;
  versionLabel?: string;
  phases: RecetaRecipeWizardPhaseItem[];
  compact?: boolean;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

function ReviewRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export function RecetaRecipeWizardReviewStep({
  theme = 'dark',
  name,
  categoryLabel,
  finishedProductLabel,
  batchLabel,
  packageWeightLabel,
  estimatedMinutes,
  isActive,
  notes,
  versionLabel,
  phases,
  compact = false,
  className,
}: RecetaRecipeWizardReviewStepProps): JSX.Element {
  const totalPhaseMinutes = phases.reduce((sum, phase) => sum + phase.durationMin, 0);

  return (
    <section
      className={[styles.panel, themeClasses[theme], compact && styles.panelCompact, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Revisión de la receta"
    >
      <h2 className={styles.title}>Revisión final</h2>
      <p className={styles.hint}>Confirma los datos antes de guardar la receta.</p>

      <div className={styles.summary}>
        <div className={styles.summaryHeader}>
          <div>
            <h3 className={styles.recipeName}>{name}</h3>
            {versionLabel ? <p className={styles.version}>{versionLabel}</p> : null}
          </div>
          <RecetaStatusButton
            theme={theme}
            status={isActive ? 'active' : 'inactive'}
            label={isActive ? 'Activa' : 'Inactiva'}
            disabled
            tabIndex={-1}
          />
        </div>

        <div className={styles.rows}>
          {categoryLabel ? (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Categoría</span>
              <RecetaCategoryChip theme={theme} label={categoryLabel} />
            </div>
          ) : null}
          {finishedProductLabel ? (
            <ReviewRow label="Producto terminado" value={finishedProductLabel} />
          ) : null}
          <ReviewRow label="Lote" value={batchLabel} />
          {packageWeightLabel ? (
            <ReviewRow label="Peso por paquete" value={packageWeightLabel} />
          ) : null}
          <ReviewRow label="Tiempo estimado" value={`${estimatedMinutes} min`} />
          <ReviewRow label="Suma de fases" value={`${totalPhaseMinutes} min`} />
          {notes?.trim() ? <ReviewRow label="Notas" value={notes.trim()} /> : null}
        </div>
      </div>

      <div className={styles.phasesSection}>
        <h3 className={styles.phasesTitle}>Fases ({phases.length})</h3>
        <div className={styles.phasesList}>
          {phases.map((phase, index) => (
            <RecetaStepCard
              key={phase.id}
              theme={theme}
              stepNumber={index + 1}
              title={phase.title}
              description={phase.description}
              duration={`${phase.durationMin} min`}
              assignee={phase.assignee}
              readOnly
              selected={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RecetaRecipeWizardReviewStep;
