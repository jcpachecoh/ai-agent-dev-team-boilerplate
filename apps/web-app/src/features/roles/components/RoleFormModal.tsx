import { RecetaFormButton } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useState, type JSX } from 'react';

import type { AdminRole, CreateRoleFormValues, UpdateRoleFormValues } from '../types';
import styles from './RoleFormModal.module.scss';

const UPPER_SNAKE_RE = /^[A-Z][A-Z0-9_]*$/;

export type RoleFormMode = 'create' | 'edit';

interface CreateProps {
  mode: 'create';
  role?: undefined;
  onSave: (values: CreateRoleFormValues) => void;
}

interface EditProps {
  mode: 'edit';
  role: AdminRole;
  onSave: (values: UpdateRoleFormValues) => void;
}

type RoleFormModalProps = (CreateProps | EditProps) & {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
};

export function RoleFormModal({
  open,
  mode,
  role,
  saving = false,
  onClose,
  onSave,
}: RoleFormModalProps): JSX.Element | null {
  const titleId = useId();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    if (isEdit && role) {
      setCode(role.code);
      setName(role.name);
      setDescription(role.description ?? '');
      setIsActive(role.isActive);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [open, isEdit, role]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre del rol es obligatorio.');
      return;
    }
    if (!isEdit) {
      if (!code.trim()) {
        setError('El código es obligatorio.');
        return;
      }
      if (!UPPER_SNAKE_RE.test(code.trim())) {
        setError('El código debe estar en formato UPPER_SNAKE_CASE (ej: NUEVO_ROL).');
        return;
      }
    }
    setError(null);
    if (isEdit) {
      onSave({
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      });
    } else {
      onSave({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {isEdit ? `Editar rol: ${role?.code}` : 'Nuevo rol'}
            </h2>
            <p className={styles.subtitle}>
              {isEdit
                ? 'Modifica nombre, descripción o estado del rol'
                : 'Define código y nombre del rol'}
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
          {!isEdit ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Código * (UPPER_SNAKE_CASE)</span>
              <input
                className={styles.input}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: NUEVO_ROL"
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre *</span>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Nuevo Rol"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descripción (opcional)</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del rol y sus responsabilidades"
            />
          </label>

          {isEdit ? (
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Rol activo</span>
            </label>
          ) : null}

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton variant="cancel" label="Cancelar" onClick={onClose} disabled={saving} />
          <RecetaFormButton
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear rol'}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
