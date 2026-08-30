import React, { type JSX } from 'react';

import { RecetaPhaseAddButton } from '../receta-phase-add-button/RecetaPhaseAddButton';
import type { RecetaTheme } from '../shared/receta-types';
import styles from './RecetaRecipeWizardPhasesStep.module.scss';

export interface RecetaRecipeWizardCompositionStepProps {
  theme?: RecetaTheme;
  componentCount: number;
  totalNetLabel: string;
  batchWeightWarning?: string | null;
  readOnly?: boolean;
  onAddComponent: () => void;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaRecipeWizardPhasesStep({
  theme = 'dark',
  componentCount,
  totalNetLabel,
  batchWeightWarning,
  readOnly = false,
  onAddComponent,
  compact = false,
  className,
  children,
}: RecetaRecipeWizardCompositionStepProps): JSX.Element {
  return (
    <section
      className={[styles.layout, themeClasses[theme], compact && styles.layoutCompact, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Composición de la receta"
    >
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Composición de la receta</h2>
            <p className={styles.hint}>
              Define los insumos, cantidades bruta/neta y tipo de componente de la receta.
            </p>
          </div>
          {!readOnly ? (
            <div className={styles.headerActions}>
              <RecetaPhaseAddButton
                theme={theme}
                label="Agregar componente"
                size="xl"
                onClick={onAddComponent}
              />
            </div>
          ) : null}
        </div>

        {componentCount === 0 ? (
          <div className={styles.emptyBlock}>
            <p className={styles.empty}>Agrega al menos un componente para continuar.</p>
            {!readOnly ? (
              <RecetaPhaseAddButton
                theme={theme}
                label="Agregar componente"
                size="md"
                onClick={onAddComponent}
              />
            ) : null}
          </div>
        ) : (
          <div className={styles.tableWrap}>{children}</div>
        )}

        {batchWeightWarning ? <p className={styles.warning}>{batchWeightWarning}</p> : null}

        {componentCount > 0 ? (
          <footer className={styles.footer}>
            <span className={styles.statPill}>
              Componentes
              <span className={styles.statValue}>{componentCount}</span>
            </span>
            <span className={styles.statPill}>
              Total neto
              <span className={styles.statValue}>{totalNetLabel}</span>
            </span>
          </footer>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated Use RecetaRecipeWizardCompositionStepProps — kept for gradual migration */
export type RecetaRecipeWizardPhasesStepProps = RecetaRecipeWizardCompositionStepProps;

export default RecetaRecipeWizardPhasesStep;
