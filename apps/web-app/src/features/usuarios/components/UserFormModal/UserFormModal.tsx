import { RecetaFormButton } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useState, type JSX } from 'react';

import styles from './UserFormModal.module.scss';
import type {
  AdminRoleOptionApi,
  DocumentType,
  UserFormValues,
  UserUpdateFormValues,
} from '../../types';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PEP', label: 'PEP' },
];

export type UserFormMode = 'create' | 'edit';

interface CreateProps {
  mode: 'create';
  initialValues?: undefined;
  onSave: (values: UserFormValues) => void;
}

interface EditProps {
  mode: 'edit';
  initialValues: UserUpdateFormValues;
  onSave: (values: UserUpdateFormValues) => void;
}

type ModeProps = CreateProps | EditProps;

type UserFormModalProps = ModeProps & {
  open: boolean;
  roles: AdminRoleOptionApi[];
  saving?: boolean;
  onClose: () => void;
};

const emptyCreate: UserFormValues = {
  name: '',
  cedula: '',
  documentType: 'CC',
  email: '',
  roleId: '',
};

export function UserFormModal({
  open,
  mode,
  initialValues,
  roles,
  saving = false,
  onClose,
  onSave,
}: UserFormModalProps): JSX.Element | null {
  const titleId = useId();
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CC');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    if (isEdit && initialValues) {
      setEmail(initialValues.email);
      setRoleId(initialValues.roleId);
    } else {
      setName(emptyCreate.name);
      setCedula(emptyCreate.cedula);
      setDocumentType(emptyCreate.documentType);
      setEmail(emptyCreate.email);
      setRoleId(roles[0]?.id ?? '');
    }
  }, [open, isEdit, initialValues, roles]);

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

  const activeRoles = roles.filter((r) => r.isActive);

  const handleSave = () => {
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!roleId) {
      setError('Selecciona un rol.');
      return;
    }
    if (!isEdit) {
      if (!name.trim()) {
        setError('El nombre es obligatorio.');
        return;
      }
      if (!cedula.trim()) {
        setError('La cédula es obligatoria.');
        return;
      }
    }
    setError(null);
    if (isEdit) {
      onSave({ email: email.trim(), roleId });
    } else {
      onSave({
        name: name.trim(),
        cedula: cedula.trim(),
        documentType,
        email: email.trim(),
        roleId,
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
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <p className={styles.subtitle}>
              {isEdit
                ? 'Actualiza email o rol del usuario'
                : 'Crea un usuario con contraseña temporal'}
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
              <span className={styles.fieldLabel}>Nombre completo *</span>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez"
              />
            </label>
          ) : null}

          {!isEdit ? (
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tipo de doc. *</span>
                <select
                  className={styles.select}
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Número de documento *</span>
                <input
                  className={styles.input}
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej: 1023456789"
                />
              </label>
            </div>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Correo electrónico *</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Rol *</span>
            <select
              className={styles.select}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">-- Seleccionar rol --</option>
              {activeRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton variant="cancel" label="Cancelar" onClick={onClose} disabled={saving} />
          <RecetaFormButton
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear usuario'}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
