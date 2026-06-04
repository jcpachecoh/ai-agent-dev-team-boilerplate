import { RecetaFormButton, RecetaTextInput } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useState, type JSX } from 'react';

import type { PlantRecipeCategory } from '@/api/plant';
import type { RecipeCategoryFormValues } from '@/features/recetas/types';

import styles from './RecipeCategoryFormModal.module.scss';

export interface RecipeCategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  category?: PlantRecipeCategory;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: RecipeCategoryFormValues) => void;
}

const emptyForm: RecipeCategoryFormValues = {
  nombre: '',
  descripcion: '',
  isActive: true,
};

function categoryToFormValues(category: PlantRecipeCategory): RecipeCategoryFormValues {
  return {
    nombre: category.nombre,
    descripcion: category.descripcion ?? '',
    isActive: category.isActive,
  };
}

export function RecipeCategoryFormModal({
  open,
  mode,
  category,
  saving = false,
  onClose,
  onSave,
}: RecipeCategoryFormModalProps): JSX.Element | null {
  const titleId = useId();
  const [values, setValues] = useState<RecipeCategoryFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(category ? categoryToFormValues(category) : emptyForm);
    setFormError(null);
  }, [open, category]);

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
    if (!values.nombre.trim()) {
      setFormError('El nombre de la categoría es obligatorio.');
      return;
    }
    setFormError(null);
    onSave(values);
  };

  const update = (patch: Partial<RecipeCategoryFormValues>) =>
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
              {mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
            </h2>
            <p className={styles.subtitle}>Clasificación de recetas de producción</p>
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <RecetaTextInput
              theme="dark"
              className={styles.fullWidthControl}
              value={values.nombre}
              onChange={(event) => update({ nombre: event.target.value })}
              placeholder="Ej: Platos principales"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descripción</span>
            <textarea
              className={styles.textarea}
              value={values.descripcion}
              onChange={(event) => update({ descripcion: event.target.value })}
              placeholder="Descripción opcional de la categoría"
            />
          </label>

          {mode === 'edit' ? (
            <div className={styles.toggleField}>
              <div className={styles.toggleCopy}>
                <span className={styles.toggleLabel}>Estado</span>
                <span className={styles.toggleHint}>
                  {values.isActive
                    ? 'Activa — visible al crear o editar recetas'
                    : 'Inactiva — no aparece en el selector de recetas'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                aria-label="Categoría activa"
                className={[styles.toggle, values.isActive ? styles.toggleOn : ''].join(' ')}
                onClick={() => update({ isActive: !values.isActive })}
              >
                <span className={styles.toggleThumb} aria-hidden />
              </button>
            </div>
          ) : null}

          {formError ? <p className={styles.errorText}>{formError}</p> : null}
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton
            theme="dark"
            variant="cancel"
            label="Cancelar"
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            theme="dark"
            variant="save"
            label={mode === 'create' ? 'Crear categoría' : 'Guardar cambios'}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
