import { Check } from 'lucide-react';
import React, { type JSX } from 'react';

import type { RecetaTheme } from '../shared/receta-types';
import type { RecetaWizardStepItem } from '../shared/receta-wizard-types';
import styles from './RecetaWizardStepper.module.scss';

export interface RecetaWizardStepperProps {
  steps: RecetaWizardStepItem[];
  activeStepId: string;
  onStepClick?: (stepId: string) => void;
  theme?: RecetaTheme;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaWizardStepper({
  steps,
  activeStepId,
  onStepClick,
  theme = 'dark',
  className,
}: RecetaWizardStepperProps): JSX.Element {
  const activeIndex = steps.findIndex((step) => step.id === activeStepId);

  return (
    <nav
      className={[styles.stepper, themeClasses[theme], className].filter(Boolean).join(' ')}
      aria-label="Pasos del asistente"
    >
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const status =
            step.status ??
            (step.id === activeStepId ? 'active' : index < activeIndex ? 'completed' : 'pending');
          const isClickable =
            Boolean(onStepClick) && (status === 'completed' || status === 'active');

          return (
            <li key={step.id} className={styles.item}>
              <button
                type="button"
                className={[
                  styles.stepButton,
                  styles[`status--${status}`],
                  !isClickable && styles.stepButtonStatic,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={isClickable ? () => onStepClick?.(step.id) : undefined}
                disabled={!isClickable}
                aria-current={status === 'active' ? 'step' : undefined}
              >
                <span className={styles.marker} aria-hidden>
                  {status === 'completed' ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                </span>
                <span className={styles.label}>{step.label}</span>
              </button>
              {index < steps.length - 1 ? <span className={styles.connector} aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default RecetaWizardStepper;
