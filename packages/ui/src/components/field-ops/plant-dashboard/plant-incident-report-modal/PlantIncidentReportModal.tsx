import {
  AlertTriangle,
  Camera,
  ChefHat,
  CircleAlert,
  PackageX,
  PauseCircle,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { useMemo, useState, type JSX } from 'react';

import { PlantDashboardModalPortal } from '../shared/PlantDashboardModalPortal';
import type {
  PlantDashboardThemeProps,
  PlantNoveltySeverity,
  PlantNoveltyType,
} from '../shared/plant-workstation-types';
import {
  PLANT_NOVELTY_SEVERITY_OPTIONS,
  PLANT_NOVELTY_TYPE_OPTIONS,
} from '../shared/plant-workstation-types';
import styles from './PlantIncidentReportModal.module.scss';

const NOVELTY_ICONS: Record<PlantNoveltyType, typeof AlertTriangle> = {
  INGREDIENT_SHORTAGE: PackageX,
  EQUIPMENT_FAILURE: Wrench,
  RECIPE_DEVIATION: ChefHat,
  UNPLANNED_STOP: PauseCircle,
  SAFETY_INCIDENT: ShieldAlert,
  QUALITY_ISSUE: CircleAlert,
  OTHER: AlertTriangle,
};

const SEVERITY_DOT: Record<PlantNoveltySeverity, string> = {
  LOW: '🟡',
  MEDIUM: '🟠',
  HIGH: '🔴',
};

export interface PlantIncidentReportModalProps extends PlantDashboardThemeProps {
  open: boolean;
  onClose: () => void;
  subtitle?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  noveltyType: PlantNoveltyType;
  onNoveltyTypeChange: (value: PlantNoveltyType) => void;
  severity: PlantNoveltySeverity;
  onSeverityChange: (value: PlantNoveltySeverity) => void;
  requiresPause: boolean;
  onRequiresPauseChange: (value: boolean) => void;
  photoPreview?: string | null;
  onCapturePhoto?: () => void;
  isCapturing?: boolean;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

export function PlantIncidentReportModal({
  open,
  onClose,
  subtitle,
  description,
  onDescriptionChange,
  noveltyType,
  onNoveltyTypeChange,
  severity,
  onSeverityChange,
  requiresPause,
  onRequiresPauseChange,
  photoPreview = null,
  onCapturePhoto,
  isCapturing = false,
  error = null,
  isSubmitting = false,
  onSubmit,
  theme = 'dark',
  size = 'xl',
  className,
}: PlantIncidentReportModalProps): JSX.Element | null {
  const [showDescriptionError, setShowDescriptionError] = useState(false);

  const canSubmit = useMemo(() => description.trim().length > 0, [description]);

  if (!open) return null;

  const captureLabel = isCapturing
    ? 'Abriendo cámara…'
    : photoPreview
      ? 'Cambiar foto'
      : 'Tomar foto';

  const handleSubmit = () => {
    if (!canSubmit) {
      setShowDescriptionError(true);
      return;
    }
    setShowDescriptionError(false);
    onSubmit();
  };

  return (
    <PlantDashboardModalPortal open={open}>
      <div
        className={[styles.overlay, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
        role="presentation"
        onClick={onClose}
        data-testid="plant-incident-report-modal"
      >
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plant-incident-report-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Novedad en estación</p>
              <h2 id="plant-incident-report-title" className={styles.title}>
                Reportar novedad
              </h2>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              <X size={16} aria-hidden />
            </button>
          </header>

          <div className={styles.body}>
            <fieldset className={styles.typeFieldset}>
              <legend className={styles.fieldLabel}>Tipo de novedad *</legend>
              <div className={styles.typeGrid} role="radiogroup" aria-label="Tipo de novedad">
                {PLANT_NOVELTY_TYPE_OPTIONS.map((option) => {
                  const Icon = NOVELTY_ICONS[option.value];
                  const selected = noveltyType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={option.label}
                      className={[styles.typeOption, selected && styles.typeOptionSelected].join(
                        ' ',
                      )}
                      onClick={() => onNoveltyTypeChange(option.value)}
                    >
                      <Icon size={22} aria-hidden className={styles.typeIcon} />
                      <span className={styles.typeLabel}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descripción *</span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(event) => {
                  if (showDescriptionError && event.target.value.trim()) {
                    setShowDescriptionError(false);
                  }
                  onDescriptionChange(event.target.value);
                }}
                rows={4}
                placeholder="Describe la novedad en la estación..."
                aria-invalid={showDescriptionError}
              />
              {showDescriptionError ? (
                <p className={styles.fieldError} role="alert">
                  La descripción es obligatoria
                </p>
              ) : null}
            </label>

            <div className={styles.severitySection}>
              <span className={styles.fieldLabel}>Gravedad</span>
              <div className={styles.severityChips} role="radiogroup" aria-label="Gravedad">
                {PLANT_NOVELTY_SEVERITY_OPTIONS.map((option) => {
                  const selected = severity === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={option.label}
                      className={[
                        styles.severityChip,
                        styles[`severity--${option.value.toLowerCase()}`],
                        selected && styles.severityChipSelected,
                      ].join(' ')}
                      onClick={() => onSeverityChange(option.value)}
                    >
                      <span aria-hidden>{SEVERITY_DOT[option.value]}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className={styles.pauseToggle}>
              <input
                type="checkbox"
                checked={requiresPause}
                onChange={(event) => onRequiresPauseChange(event.target.checked)}
                aria-label="¿Requiere pausa de la orden?"
              />
              <span>¿Requiere pausa de la orden?</span>
            </label>

            {onCapturePhoto ? (
              <section className={styles.photoSection}>
                <div className={styles.photoHeader}>
                  <span className={styles.fieldLabel}>Evidencia fotográfica</span>
                  <button
                    type="button"
                    className={styles.captureBtn}
                    onClick={onCapturePhoto}
                    disabled={isCapturing}
                  >
                    <Camera size={14} aria-hidden />
                    {captureLabel}
                  </button>
                </div>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Vista previa del incidente"
                    className={styles.preview}
                  />
                ) : (
                  <p className={styles.photoHint}>Opcional. Usa la cámara nativa en tablet.</p>
                )}
              </section>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? 'Enviando…' : 'REGISTRAR NOVEDAD'}
            </button>
          </footer>
        </div>
      </div>
    </PlantDashboardModalPortal>
  );
}

export default PlantIncidentReportModal;
