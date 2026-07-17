import { RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { Copy, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type JSX } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import {
  findEmployeeNameByDocument,
  resetEmployeeDocumentLookupCache,
} from '../../api/employee-document-lookup';
import styles from './UserFormModal.module.scss';
import type {
  AdminRoleOptionApi,
  DocumentType,
  UserFormValues,
  UserUpdateFormValues,
  UserEditInitialValues,
} from '../../types';
import { generatePasswordForRole } from '../../utils/generate-password';

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
  initialValues: UserEditInitialValues;
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
  password: '',
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
  const { theme } = useTheme();
  const titleId = useId();
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CC');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [lookingUpEmployee, setLookingUpEmployee] = useState(false);
  const lookupRequestIdRef = useRef(0);
  const isEdit = mode === 'edit';

  const selectedRole = roles.find((r) => r.id === roleId);

  const regeneratePassword = useCallback(() => {
    setPassword(generatePasswordForRole(selectedRole?.code));
  }, [selectedRole?.code]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setLookupHint(null);
    setLookingUpEmployee(false);
    lookupRequestIdRef.current += 1;
    if (isEdit && initialValues) {
      setName(initialValues.name);
      setEmail(initialValues.email);
      setRoleId(initialValues.roleId);
    } else {
      setName(emptyCreate.name);
      setCedula(emptyCreate.cedula);
      setDocumentType(emptyCreate.documentType);
      setEmail(emptyCreate.email);
      setRoleId(roles[0]?.id ?? '');
      setPassword(generatePasswordForRole(roles[0]?.code));
      resetEmployeeDocumentLookupCache();
    }
  }, [open, isEdit, initialValues, roles]);

  const lookupEmployeeName = useCallback(async (cedulaValue: string, docType: DocumentType) => {
    const trimmedCedula = cedulaValue.trim();
    if (!trimmedCedula) {
      setLookupHint(null);
      return;
    }

    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;
    setLookingUpEmployee(true);
    setLookupHint('Consultando empleado registrado...');

    try {
      const employeeName = await findEmployeeNameByDocument(trimmedCedula, docType);
      if (lookupRequestIdRef.current !== requestId) {
        return;
      }

      if (employeeName) {
        setName(employeeName);
        setLookupHint('Nombre completado desde empleados registrados.');
      } else {
        setLookupHint(null);
      }
    } catch {
      if (lookupRequestIdRef.current === requestId) {
        setLookupHint(null);
      }
    } finally {
      if (lookupRequestIdRef.current === requestId) {
        setLookingUpEmployee(false);
      }
    }
  }, []);

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

  const activeRoles = roles.filter((r) => r.isActive);
  const roleOptions = useMemo(
    () => activeRoles.map((role) => ({ value: role.id, label: role.name })),
    [activeRoles],
  );
  const documentTypeOptions = useMemo(
    () => DOCUMENT_TYPES.map((item) => ({ value: item.value, label: item.label })),
    [],
  );

  if (!open) {
    return null;
  }

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
        setError(
          'No se encontró un empleado con esa cédula. Regístralo primero en Nómina/Empleados.',
        );
        return;
      }
      if (!cedula.trim()) {
        setError('La cédula es obligatoria.');
        return;
      }
      if (!password.trim()) {
        setError('Genera una contraseña temporal antes de continuar.');
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
        password: password.trim(),
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
                : 'Se enviará un correo para que el usuario configure su contraseña'}
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
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tipo de doc. *</span>
                <RecetaFilterSelect
                  id="documentType"
                  aria-label="Tipo de documento"
                  options={documentTypeOptions}
                  value={documentType}
                  onChange={(value) => {
                    const nextDocumentType = value as DocumentType;
                    setDocumentType(nextDocumentType);
                    setLookupHint(null);
                    setName('');
                    if (cedula.trim()) {
                      void lookupEmployeeName(cedula, nextDocumentType);
                    }
                  }}
                  theme={theme}
                  size="md"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Número de documento *</span>
                <input
                  className={styles.input}
                  type="text"
                  value={cedula}
                  onChange={(e) => {
                    setCedula(e.target.value);
                    setLookupHint(null);
                    setName('');
                  }}
                  onBlur={() => void lookupEmployeeName(cedula, documentType)}
                  placeholder="Ej: 1023456789"
                />
              </label>
            </div>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nombre completo {!isEdit ? '*' : ''}</span>
            <input
              className={`${styles.input} ${styles.readOnlyInput}`}
              type="text"
              readOnly
              value={name}
              aria-label="Nombre completo"
              placeholder={
                isEdit
                  ? undefined
                  : lookingUpEmployee
                    ? 'Consultando empleado...'
                    : 'Se completa al ingresar la cédula de un empleado'
              }
            />
            {!isEdit && lookupHint ? <p className={styles.hintText}>{lookupHint}</p> : null}
            {!isEdit && !lookupHint && !name.trim() ? (
              <p className={styles.hintText}>
                El nombre se obtiene del módulo Empleados y no se puede editar aquí.
              </p>
            ) : null}
          </label>

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

          {!isEdit ? (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Contraseña temporal *</span>
              <div className={styles.passwordRow}>
                <input
                  className={styles.passwordInput}
                  type="text"
                  readOnly
                  value={password}
                  aria-label="Contraseña temporal generada"
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={regeneratePassword}
                  aria-label="Regenerar contraseña"
                  title="Regenerar"
                >
                  <RefreshCw size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => void navigator.clipboard.writeText(password)}
                  aria-label="Copiar contraseña"
                  title="Copiar"
                >
                  <Copy size={16} aria-hidden />
                </button>
              </div>
              <p className={styles.hintText}>
                Se genera automáticamente. El usuario recibirá un correo para confirmar su cuenta y
                configurar su contraseña definitiva.
              </p>
            </div>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Rol *</span>
            <RecetaFilterSelect
              id="roleId"
              aria-label="Rol"
              options={roleOptions}
              value={roleId}
              onChange={(value) => {
                const nextRole = roles.find((role) => role.id === value);
                setRoleId(value);
                setPassword(generatePasswordForRole(nextRole?.code));
              }}
              placeholder="-- Seleccionar rol --"
              theme={theme}
              size="md"
            />
          </label>

          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <RecetaFormButton
            variant="cancel"
            label="Cancelar"
            theme={theme}
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear usuario'}
            theme={theme}
            onClick={handleSave}
            disabled={saving}
          />
        </footer>
      </div>
    </div>
  );
}
