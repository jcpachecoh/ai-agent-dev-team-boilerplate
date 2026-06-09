import { InventarioFormField, InventarioModal } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import type { SupplyCategoryApi, SupplyCategoryFormValues } from '@/features/inventario/types';
import type { UiTheme } from '@/constants/theme';

import styles from './ProductFormModal.module.scss';

export interface CategoryFormModalProps {
  theme: UiTheme;
  open: boolean;
  mode: 'create' | 'edit';
  category?: SupplyCategoryApi;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: SupplyCategoryFormValues) => void;
}

const emptyForm: SupplyCategoryFormValues = {
  nombre: '',
  descripcion: '',
  isActive: true,
};

function categoryToFormValues(category: SupplyCategoryApi): SupplyCategoryFormValues {
  return {
    nombre: category.nombre,
    descripcion: category.descripcion ?? '',
    isActive: category.isActive,
  };
}

export function CategoryFormModal({
  theme,
  open,
  mode,
  category,
  saving = false,
  onClose,
  onSave,
}: CategoryFormModalProps): React.JSX.Element {
  const [values, setValues] = useState<SupplyCategoryFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(category ? categoryToFormValues(category) : emptyForm);
    setFormError(null);
  }, [open, category]);

  const handleSave = () => {
    if (!values.nombre.trim()) {
      setFormError('El nombre de la categoría es obligatorio.');
      return;
    }
    setFormError(null);
    onSave(values);
  };

  const update = (patch: Partial<SupplyCategoryFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  return (
    <InventarioModal
      open={open}
      title={mode === 'create' ? 'Crear categoría' : 'Editar categoría'}
      subtitle="Clasificación de insumos en inventario"
      onClose={onClose}
      onSave={handleSave}
      saveLoading={saving}
      theme={theme}
      size="xl"
    >
      <div className={styles.formGrid}>
        <InventarioFormField label="Nombre *" theme={theme} size="md">
          <input
            className={styles.input}
            value={values.nombre}
            onChange={(e) => update({ nombre: e.target.value })}
          />
        </InventarioFormField>
        <InventarioFormField label="Descripción" theme={theme} size="md">
          <input
            className={styles.input}
            value={values.descripcion}
            onChange={(e) => update({ descripcion: e.target.value })}
          />
        </InventarioFormField>
        {mode === 'edit' ? (
          <div className={styles.toggleField}>
            <div className={styles.toggleCopy}>
              <span className={styles.toggleLabel}>Estado</span>
              <span className={styles.toggleHint}>
                {values.isActive
                  ? 'Activa — visible en insumos y filtros'
                  : 'Inactiva — no aparece al crear insumos'}
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
        {formError ? <span className={styles.errorText}>{formError}</span> : null}
      </div>
    </InventarioModal>
  );
}
