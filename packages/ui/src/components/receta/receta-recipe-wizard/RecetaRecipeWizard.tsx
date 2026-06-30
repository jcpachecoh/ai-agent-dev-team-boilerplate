import { ArrowLeft, ArrowRight } from 'lucide-react';
import React, { type JSX, useEffect, useMemo } from 'react';

import { RecetaFormButton } from '../receta-form-button/RecetaFormButton';
import { RecetaRecipeWizardGeneralStep } from '../receta-recipe-wizard-general-step/RecetaRecipeWizardGeneralStep';
import type { RecetaRecipeWizardGeneralStepProps } from '../receta-recipe-wizard-general-step/RecetaRecipeWizardGeneralStep';
import { RecetaRecipeWizardPhasesStep } from '../receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep';
import type { RecetaRecipeWizardCompositionStepProps } from '../receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep';
import { RecetaRecipeWizardProductionPhasesStep } from '../receta-recipe-wizard-production-phases-step/RecetaRecipeWizardProductionPhasesStep';
import type { RecetaRecipeWizardProductionPhasesStepProps } from '../receta-recipe-wizard-production-phases-step/RecetaRecipeWizardProductionPhasesStep';
import { RecetaWizardShell } from '../receta-wizard-shell/RecetaWizardShell';
import type { RecetaTheme } from '../shared/receta-types';
import type { RecetaRecipeWizardStepId } from '../shared/receta-wizard-types';
import styles from './RecetaRecipeWizard.module.scss';

const WIZARD_STEPS: Array<{ id: RecetaRecipeWizardStepId; label: string }> = [
  { id: 'general', label: 'Datos generales' },
  { id: 'composition', label: 'Composición' },
  { id: 'phases', label: 'Fases' },
];

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export interface RecetaRecipeWizardProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  title?: string;
  code?: string;
  currentStep: RecetaRecipeWizardStepId;
  maxReachedStep?: RecetaRecipeWizardStepId;
  onStepChange: (step: RecetaRecipeWizardStepId) => void;
  theme?: RecetaTheme;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  nextDisabled?: boolean;
  saveDisabled?: boolean;
  generalStep: RecetaRecipeWizardGeneralStepProps;
  compositionStep: RecetaRecipeWizardCompositionStepProps;
  productionPhasesStep: RecetaRecipeWizardProductionPhasesStepProps;
  className?: string;
}

function stepIndex(stepId: RecetaRecipeWizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId);
}

export function RecetaRecipeWizard({
  open,
  onClose,
  mode,
  title,
  code,
  currentStep,
  maxReachedStep,
  onStepChange,
  theme = 'dark',
  loading = false,
  saving = false,
  error = null,
  onSave,
  onNext,
  onPrevious,
  nextDisabled = false,
  saveDisabled = false,
  generalStep,
  compositionStep,
  productionPhasesStep,
  className,
}: RecetaRecipeWizardProps): JSX.Element | null {
  const resolvedTitle = title ?? (mode === 'edit' ? 'Editar Receta' : 'Nueva Receta');
  const resolvedCode = code ?? (mode === 'edit' ? '—' : 'Nueva');
  const currentIndex = stepIndex(currentStep);
  const maxIndex = stepIndex(maxReachedStep ?? currentStep);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const steps = useMemo(
    () =>
      WIZARD_STEPS.map((step, index) => ({
        ...step,
        status:
          step.id === currentStep
            ? ('active' as const)
            : index < currentIndex || (index <= maxIndex && index > currentIndex)
              ? ('completed' as const)
              : ('pending' as const),
      })),
    [currentStep, currentIndex, maxIndex],
  );

  const handleStepClick = (stepId: string): void => {
    const targetIndex = stepIndex(stepId as RecetaRecipeWizardStepId);
    if (targetIndex <= maxIndex) {
      onStepChange(stepId as RecetaRecipeWizardStepId);
    }
  };

  if (!open) {
    return null;
  }

  const handleBackdropClick = (): void => {
    onClose();
  };

  const handleDialogClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  const footer = (
    <div className={styles.footerActions}>
      {currentStep === 'general' ? (
        <RecetaFormButton variant="cancel" theme={theme} label="Cancelar" onClick={onClose} />
      ) : (
        <RecetaFormButton
          variant="cancel"
          theme={theme}
          label="Anterior"
          icon={<ArrowLeft aria-hidden />}
          onClick={onPrevious}
        />
      )}

      {currentStep === 'phases' ? (
        <RecetaFormButton
          variant="save"
          theme={theme}
          label={saving ? 'Guardando...' : 'Guardar'}
          disabled={saveDisabled || saving || loading}
          onClick={onSave}
        />
      ) : (
        <RecetaFormButton
          variant="add"
          theme={theme}
          label="Siguiente"
          icon={<ArrowRight aria-hidden />}
          disabled={nextDisabled || loading}
          onClick={onNext}
        />
      )}
    </div>
  );

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation">
      <div
        className={[styles.dialog, themeClasses[theme]].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receta-recipe-wizard-title"
        onClick={handleDialogClick}
      >
        <RecetaWizardShell
          className={[styles.wizard, className].filter(Boolean).join(' ')}
          variant="modal"
          theme={theme}
          title={resolvedTitle}
          subtitle={resolvedCode}
          steps={steps}
          activeStepId={currentStep}
          onStepClick={handleStepClick}
          onClose={onClose}
          error={error}
          loading={loading}
          loadingMessage="Cargando datos del editor..."
          footer={footer}
        >
          {currentStep === 'general' ? (
            <RecetaRecipeWizardGeneralStep theme={theme} compact {...generalStep} />
          ) : null}
          {currentStep === 'composition' ? (
            <RecetaRecipeWizardPhasesStep theme={theme} compact {...compositionStep} />
          ) : null}
          {currentStep === 'phases' ? (
            <RecetaRecipeWizardProductionPhasesStep
              theme={theme}
              compact
              {...productionPhasesStep}
            />
          ) : null}
        </RecetaWizardShell>
      </div>
    </div>
  );
}

export default RecetaRecipeWizard;
