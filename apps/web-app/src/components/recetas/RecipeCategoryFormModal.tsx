import { RecetaFormButton, RecetaTextInput } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useState, type JSX } from 'react';

import type { PlantRecipeCategory } from '@/api/plant';
import type { UiTheme } from '@/constants/theme';
import type { RecipeCategoryFormValues } from '@/features/recetas/types';

import styles from './RecipeCategoryFormModal.module.scss';

export interface RecipeCategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  theme?: UiTheme;
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
  theme = 'dark',
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
              theme={theme}
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
            label={mode === 'create' ? 'Crear categoría' : 'Guardar cambios'}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
