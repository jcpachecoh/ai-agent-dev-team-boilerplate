import React, { type JSX } from 'react';

import { RecetaPhaseAddButton } from '../receta-phase-add-button/RecetaPhaseAddButton';
import type { RecetaTheme } from '../shared/receta-types';
import styles from './RecetaRecipeWizardProductionPhasesStep.module.scss';

export interface RecetaRecipeWizardProductionPhasesStepProps {
  theme?: RecetaTheme;
  phaseCount: number;
  totalMinutes: number;
  timeWarning?: string | null;
  readOnly?: boolean;
  onAddPhase: () => void;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaRecipeWizardProductionPhasesStep({
  theme = 'dark',
  phaseCount,
  totalMinutes,
  timeWarning,
  readOnly = false,
  onAddPhase,
  compact = false,
  className,
  children,
}: RecetaRecipeWizardProductionPhasesStepProps): JSX.Element {
  return (
    <section
      className={[styles.layout, themeClasses[theme], compact && styles.layoutCompact, className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Fases del proceso"
    >
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Fases del proceso</h2>
            <p className={styles.hint}>
              Define cada etapa operativa, tiempos, insumos de composición y equipos.
            </p>
          </div>
          {!readOnly ? (
            <div className={styles.headerActions}>
              <RecetaPhaseAddButton
                theme={theme}
                label="Agregar fase"
                size="xl"
                onClick={onAddPhase}
              />
            </div>
          ) : null}
        </div>

        {phaseCount === 0 ? (
          <div className={styles.emptyBlock}>
            <p className={styles.empty}>Agrega al menos una fase para continuar.</p>
            {!readOnly ? (
              <RecetaPhaseAddButton
                theme={theme}
                label="Agregar fase"
                size="md"
                onClick={onAddPhase}
              />
            ) : null}
          </div>
        ) : (
          <div className={styles.listWrap}>{children}</div>
        )}

        {timeWarning ? <p className={styles.warning}>{timeWarning}</p> : null}

        {phaseCount > 0 ? (
          <footer className={styles.footer}>
            <span className={styles.statPill}>
              Fases
              <span className={styles.statValue}>{phaseCount}</span>
            </span>
            <span className={styles.statPill}>
              Tiempo total
              <span className={styles.statValue}>{totalMinutes} min</span>
            </span>
          </footer>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated Legacy card item — use children slot with accordion in web-app */
export interface RecetaRecipeWizardProductionPhaseItem {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  assignee: string;
}

export default RecetaRecipeWizardProductionPhasesStep;
