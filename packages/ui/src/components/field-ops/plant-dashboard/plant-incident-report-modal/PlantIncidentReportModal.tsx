import { Camera, X } from 'lucide-react';
import type { JSX } from 'react';

import { PlantDashboardModalPortal } from '../shared/PlantDashboardModalPortal';
import type {
  PlantAlarmSeverity,
  PlantDashboardThemeProps,
  PlantIncidentType,
  PlantSelectOption,
} from '../shared/plant-workstation-types';
import {
  PLANT_ALARM_SEVERITY_OPTIONS,
  PLANT_INCIDENT_TYPE_OPTIONS,
} from '../shared/plant-workstation-types';
import styles from './PlantIncidentReportModal.module.scss';

export interface PlantIncidentReportModalProps extends PlantDashboardThemeProps {
  open: boolean;
  onClose: () => void;
  subtitle?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  type: PlantIncidentType;
  onTypeChange: (value: PlantIncidentType) => void;
  severity: PlantAlarmSeverity;
  onSeverityChange: (value: PlantAlarmSeverity) => void;
  typeOptions?: PlantSelectOption<PlantIncidentType>[];
  severityOptions?: PlantSelectOption<PlantAlarmSeverity>[];
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
  type,
  onTypeChange,
  severity,
  onSeverityChange,
  typeOptions = PLANT_INCIDENT_TYPE_OPTIONS,
  severityOptions = PLANT_ALARM_SEVERITY_OPTIONS,
  photoPreview = null,
  onCapturePhoto,
  isCapturing = false,
  error = null,
  isSubmitting = false,
  onSubmit,
  theme = 'dark',
  size = 'md',
  className,
}: PlantIncidentReportModalProps): JSX.Element | null {
  if (!open) return null;

  const captureLabel = isCapturing
    ? 'Abriendo cámara…'
    : photoPreview
      ? 'Cambiar foto'
      : 'Tomar foto';

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
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descripción *</span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                rows={4}
                placeholder="Describe la novedad en la estación..."
              />
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tipo</span>
                <select
                  className={styles.select}
                  value={type}
                  onChange={(event) => onTypeChange(event.target.value as PlantIncidentType)}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Severidad</span>
                <select
                  className={styles.select}
                  value={severity}
                  onChange={(event) => onSeverityChange(event.target.value as PlantAlarmSeverity)}
                >
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section className={styles.photoSection}>
              <div className={styles.photoHeader}>
                <span className={styles.fieldLabel}>Evidencia fotográfica</span>
                {onCapturePhoto ? (
                  <button
                    type="button"
                    className={styles.captureBtn}
                    onClick={onCapturePhoto}
                    disabled={isCapturing}
                  >
                    <Camera size={14} aria-hidden />
                    {captureLabel}
                  </button>
                ) : null}
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
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando…' : 'Reportar'}
            </button>
          </footer>
        </div>
      </div>
    </PlantDashboardModalPortal>
  );
}

export default PlantIncidentReportModal;
