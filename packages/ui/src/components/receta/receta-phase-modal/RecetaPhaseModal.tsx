import { Box, CheckSquare, Clock, Users, X } from 'lucide-react';
import React, { type JSX, type ReactNode, useEffect, useId } from 'react';

import { RecetaFilterSelect, type RecetaFilterOption } from '../receta-filter-select';
import { RecetaFormButton } from '../receta-form-button';
import { RecetaTextInput } from '../receta-text-input';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaPhaseModal.module.scss';

export interface RecetaPhaseModalProps {
  open: boolean;
  onClose: () => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
  title?: string;
  subtitle?: string;
  phaseName: string;
  onPhaseNameChange: (value: string) => void;
  phaseDescription: string;
  onPhaseDescriptionChange: (value: string) => void;
  phaseDuration: string;
  onPhaseDurationChange: (value: string) => void;
  phaseResponsible: string;
  responsibleOptions: RecetaFilterOption[];
  onPhaseResponsibleChange: (value: string) => void;
  onAddIngredient?: () => void;
  onAddValidation?: () => void;
  ingredientsContent?: ReactNode;
  validationsContent?: ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  isSaving?: boolean;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

const sizeClasses: Record<RecetaSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  xl: styles.sizeXl,
};

export function RecetaPhaseModal({
  open,
  onClose,
  theme = 'dark',
  size = 'md',
  title = 'Nueva Fase de Proceso',
  subtitle = 'Configure los detalles operacionales de la fase',
  phaseName,
  onPhaseNameChange,
  phaseDescription,
  onPhaseDescriptionChange,
  phaseDuration,
  onPhaseDurationChange,
  phaseResponsible,
  responsibleOptions,
  onPhaseResponsibleChange,
  onAddIngredient,
  onAddValidation,
  ingredientsContent,
  validationsContent,
  onCancel,
  onSave,
  cancelLabel = 'Cancelar',
  saveLabel = 'Guardar Fase',
  isSaving = false,
}: RecetaPhaseModalProps): JSX.Element | null {
  const titleId = useId();

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

  if (!open) {
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const handleDialogClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation">
      <div
        className={[styles.dialog, themeClasses[theme], sizeClasses[size]]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={handleDialogClick}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section} aria-labelledby={`${titleId}-basic`}>
            <h3 id={`${titleId}-basic`} className={styles.sectionTitle}>
              Información Básica
            </h3>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nombre de la Fase *</span>
              <RecetaTextInput
                theme={theme}
                className={styles.fullWidthControl}
                value={phaseName}
                onChange={(event) => onPhaseNameChange(event.target.value)}
                placeholder="Ej: Marinado y Reposo"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descripción Paso a Paso</span>
              <textarea
                className={styles.textarea}
                value={phaseDescription}
                onChange={(event) => onPhaseDescriptionChange(event.target.value)}
                placeholder="Describa detalladamente los pasos a seguir en esta fase..."
              />
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={[styles.fieldLabel, styles.fieldLabelRow].join(' ')}>
                  <Clock className={styles.fieldLabelIcon} aria-hidden />
                  Duración Estimada (min) *
                </span>
                <RecetaTextInput
                  theme={theme}
                  className={[styles.fullWidthControl, styles.durationInput].join(' ')}
                  inputMode="numeric"
                  value={phaseDuration}
                  onChange={(event) => onPhaseDurationChange(event.target.value)}
                  placeholder="10"
                />
              </label>

              <label className={styles.field}>
                <span className={[styles.fieldLabel, styles.fieldLabelRow].join(' ')}>
                  <Users className={styles.fieldLabelIcon} aria-hidden />
                  Responsable *
                </span>
                <RecetaFilterSelect
                  theme={theme}
                  size="md"
                  className={styles.fullWidthControl}
                  options={responsibleOptions}
                  value={phaseResponsible}
                  onChange={onPhaseResponsibleChange}
                />
              </label>
            </div>
          </section>

          <section className={styles.listSection} aria-labelledby={`${titleId}-ingredients`}>
            <div className={styles.listSectionHeader}>
              <h3 id={`${titleId}-ingredients`} className={styles.listSectionTitle}>
                <Box className={styles.listSectionIcon} aria-hidden />
                Ingredientes Requeridos
              </h3>
              <RecetaFormButton
                theme={theme}
                variant="add"
                label="Agregar"
                onClick={onAddIngredient}
              />
            </div>
            {ingredientsContent ? (
              <div className={styles.listSectionContent}>{ingredientsContent}</div>
            ) : null}
          </section>

          <section className={styles.listSection} aria-labelledby={`${titleId}-validations`}>
            <div className={styles.listSectionHeader}>
              <h3 id={`${titleId}-validations`} className={styles.listSectionTitle}>
                <CheckSquare className={styles.listSectionIcon} aria-hidden />
                Criterios de Validación
              </h3>
              <RecetaFormButton
                theme={theme}
                variant="add"
                label="Agregar"
                onClick={onAddValidation}
              />
            </div>
            {validationsContent ? (
              <div className={styles.listSectionContent}>{validationsContent}</div>
            ) : null}
          </section>
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton
            theme={theme}
            variant="cancel"
            label={cancelLabel}
            onClick={handleCancel}
            disabled={isSaving}
          />
          <RecetaFormButton
            theme={theme}
            variant="save"
            label={saveLabel}
            onClick={onSave}
            disabled={isSaving}
          />
        </footer>
      </div>
    </div>
  );
}

export default RecetaPhaseModal;
