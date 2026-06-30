import React, { type JSX } from 'react';

import { RecetaMetricCard } from '../receta-metric-card/RecetaMetricCard';
import { RecetaPhaseAddButton } from '../receta-phase-add-button/RecetaPhaseAddButton';
import { RecetaStepCard } from '../receta-step-card/RecetaStepCard';
import { RecetaTimelinePanel } from '../receta-timeline-panel/RecetaTimelinePanel';
import type { RecetaTheme } from '../shared/receta-types';
import styles from './RecetaRecipeWizardProductionPhasesStep.module.scss';

export interface RecetaRecipeWizardProductionPhaseItem {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  assignee: string;
}

export interface RecetaRecipeWizardProductionPhasesStepProps {
  theme?: RecetaTheme;
  phases: RecetaRecipeWizardProductionPhaseItem[];
  onAddPhase: () => void;
  onEditPhase: (phaseId: string) => void;
  onDeletePhase: (phaseId: string) => void;
  totalMinutes?: number;
  compact?: boolean;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaRecipeWizardProductionPhasesStep({
  theme = 'dark',
  phases,
  onAddPhase,
  onEditPhase,
  onDeletePhase,
  totalMinutes,
  compact = false,
  className,
}: RecetaRecipeWizardProductionPhasesStepProps): JSX.Element {
  const resolvedTotal = totalMinutes ?? phases.reduce((sum, phase) => sum + phase.durationMin, 0);

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
            <h2 className={styles.title}>Fases del proceso ({phases.length})</h2>
            <p className={styles.hint}>Define cada etapa de producción, tiempos y responsables.</p>
          </div>
          <RecetaPhaseAddButton theme={theme} label="Agregar Fase" size="xl" onClick={onAddPhase} />
        </div>

        {phases.length === 0 ? (
          <p className={styles.empty}>Aún no hay fases. Agrega al menos una para continuar.</p>
        ) : (
          <div className={styles.list}>
            {phases.map((phase, index) => (
              <RecetaStepCard
                key={phase.id}
                theme={theme}
                selected
                stepNumber={index + 1}
                title={phase.title}
                description={phase.description}
                duration={`${phase.durationMin} min`}
                assignee={phase.assignee}
                onEdit={() => onEditPhase(phase.id)}
                onDelete={() => onDeletePhase(phase.id)}
              />
            ))}
          </div>
        )}
      </div>

      <aside className={styles.sidebar}>
        <div className={compact ? styles.metricsRow : undefined}>
          <RecetaMetricCard
            theme={theme}
            variant="type-2"
            title="Suma fases"
            value={`${resolvedTotal} min`}
            size={compact ? 'md' : 'xl'}
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-1"
            title="Fases definidas"
            value={phases.length}
            size={compact ? 'md' : 'xl'}
          />
        </div>
        {!compact ? (
          <RecetaTimelinePanel
            theme={theme}
            title="Línea de tiempo"
            items={phases.map((phase) => ({
              label: phase.title,
              duration: `${phase.durationMin} min`,
            }))}
          />
        ) : null}
      </aside>
    </section>
  );
}

export default RecetaRecipeWizardProductionPhasesStep;
