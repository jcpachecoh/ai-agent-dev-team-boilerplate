import { X } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import { RecetaFormButton } from '../receta-form-button/RecetaFormButton';
import { RecetaWizardStepper } from '../receta-wizard-stepper/RecetaWizardStepper';
import type { RecetaTheme } from '../shared/receta-types';
import type { RecetaWizardStepItem } from '../shared/receta-wizard-types';
import styles from './RecetaWizardShell.module.scss';

export type RecetaWizardShellVariant = 'page' | 'modal';

export interface RecetaWizardShellProps {
  title: string;
  subtitle?: string;
  theme?: RecetaTheme;
  variant?: RecetaWizardShellVariant;
  steps: RecetaWizardStepItem[];
  activeStepId: string;
  onStepClick?: (stepId: string) => void;
  onClose?: () => void;
  onBack?: () => void;
  backLabel?: string;
  onDiscard?: () => void;
  discardLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaWizardShell({
  title,
  subtitle,
  theme = 'dark',
  variant = 'page',
  steps,
  activeStepId,
  onStepClick,
  onClose,
  onBack,
  backLabel = 'Volver',
  onDiscard,
  discardLabel = 'Descartar',
  children,
  footer,
  error,
  loading = false,
  loadingMessage = 'Cargando...',
  className,
}: RecetaWizardShellProps): JSX.Element {
  const isModal = variant === 'modal';
  const TitleTag = isModal ? 'h2' : 'h1';

  return (
    <div
      className={[styles.shell, themeClasses[theme], isModal && styles.shellModal, className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        {isModal ? (
          <>
            <div className={styles.headerTitles}>
              <TitleTag className={styles.title}>{title}</TitleTag>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {onClose ? (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden />
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className={styles.headerLeft}>
              {onBack ? (
                <RecetaFormButton
                  variant="cancel"
                  theme={theme}
                  label={backLabel}
                  onClick={onBack}
                />
              ) : null}
              <div className={styles.headerTitles}>
                <TitleTag className={styles.title}>{title}</TitleTag>
                {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
              </div>
            </div>
            {onDiscard ? (
              <div className={styles.headerActions}>
                <RecetaFormButton
                  variant="discard"
                  theme={theme}
                  label={discardLabel}
                  onClick={onDiscard}
                />
              </div>
            ) : null}
          </>
        )}
      </header>

      <div className={styles.stepperWrap}>
        <RecetaWizardStepper
          theme={theme}
          steps={steps}
          activeStepId={activeStepId}
          onStepClick={onStepClick}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.loading}>{loadingMessage}</p> : null}

      <div className={styles.body}>{children}</div>

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  );
}

export default RecetaWizardShell;
