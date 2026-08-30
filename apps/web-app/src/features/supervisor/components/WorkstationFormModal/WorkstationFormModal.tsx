import { RecetaFormButton, RecetaTextInput } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useState, type JSX } from 'react';

import type { UiTheme } from '@/constants/theme';

import type { WorkstationFormValues } from '../../types';
import styles from './WorkstationFormModal.module.scss';

export type WorkstationFormMode = 'create' | 'edit';

export interface WorkstationFormModalProps {
  open: boolean;
  mode?: WorkstationFormMode;
  initialValues?: WorkstationFormValues;
  theme?: UiTheme;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: WorkstationFormValues) => void;
}

const emptyForm: WorkstationFormValues = {
  name: '',
  code: '',
  description: '',
  location: '',
  isActive: true,
};

export function WorkstationFormModal({
  open,
  mode = 'create',
  initialValues,
  theme = 'dark',
  saving = false,
  onClose,
  onSave,
}: WorkstationFormModalProps): JSX.Element | null {
  const titleId = useId();
  const [values, setValues] = useState<WorkstationFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    setValues(initialValues ?? emptyForm);
    setFormError(null);
  }, [open, initialValues]);

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

  const handleSave = () => {
    if (!values.name.trim()) {
      setFormError('El nombre de la estación es obligatorio.');
      return;
    }
    if (!values.code.trim()) {
      setFormError('El código de la estación es obligatorio.');
      return;
    }
    setFormError(null);
    onSave(values);
  };

  const update = (patch: Partial<WorkstationFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {isEdit ? 'Editar estación' : 'Nueva estación'}
            </h2>
            <p className={styles.subtitle}>
              {isEdit
                ? 'Modificar datos de la estación de trabajo'
                : 'Alta de estación de trabajo en planta'}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Código *</span>
              <RecetaTextInput
                theme={theme}
                className={styles.fullWidthControl}
                value={values.code}
                onChange={(event) => update({ code: event.target.value.toUpperCase() })}
                placeholder="Ej: EST-07"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nombre *</span>
              <RecetaTextInput
                theme={theme}
                className={styles.fullWidthControl}
                value={values.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Ej: Empaque y Despacho"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ubicación</span>
            <RecetaTextInput
              theme={theme}
              className={styles.fullWidthControl}
              value={values.location}
              onChange={(event) => update({ location: event.target.value })}
              placeholder="Ej: Zona F"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descripción</span>
            <textarea
              className={styles.textarea}
              value={values.description}
              onChange={(event) => update({ description: event.target.value })}
              placeholder="Descripción opcional de la estación"
            />
          </label>

          {isEdit ? (
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={values.isActive ?? true}
                onChange={(event) => update({ isActive: event.target.checked })}
              />
              <span>Estación activa</span>
            </label>
          ) : null}

          {formError ? <p className={styles.errorText}>{formError}</p> : null}
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton
            theme={theme}
            variant="cancel"
            label="Cancelar"
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            theme={theme}
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear estación'}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
