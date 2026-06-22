import { RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { X } from 'lucide-react';
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
} from '../../types';

export interface LocationOption {
  id: string;
  name: string;
}

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
  locations?: LocationOption[];
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
  locations = [],
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
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [lookingUpEmployee, setLookingUpEmployee] = useState(false);
  const lookupRequestIdRef = useRef(0);
  const isEdit = mode === 'edit';

  const selectedRole = roles.find((r) => r.id === roleId);
  const isOperator = selectedRole?.code === 'OPERATOR';

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setLookupHint(null);
    setLookingUpEmployee(false);
    lookupRequestIdRef.current += 1;
    if (isEdit && initialValues) {
      setEmail(initialValues.email);
      setRoleId(initialValues.roleId);
    } else {
      setName(emptyCreate.name);
      setCedula(emptyCreate.cedula);
      setDocumentType(emptyCreate.documentType);
      setEmail(emptyCreate.email);
      setRoleId(roles[0]?.id ?? '');
      setLocationId('');
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
  const locationOptions = useMemo(
    () => locations.map((loc) => ({ value: loc.id, label: loc.name })),
    [locations],
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
        setError('El nombre es obligatorio.');
        return;
      }
      if (!cedula.trim()) {
        setError('La cédula es obligatoria.');
        return;
      }
      if (isOperator && !locationId) {
        setError('Selecciona una sede para el operador de planta.');
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
        ...(isOperator && locationId ? { locationId } : {}),
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
                  }}
                  onBlur={() => void lookupEmployeeName(cedula, documentType)}
                  placeholder="Ej: 1023456789"
                />
              </label>
            </div>
          ) : null}

          {!isEdit ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nombre completo *</span>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setLookupHint(null);
                }}
                placeholder="Ej: Juan Carlos Pérez"
                disabled={lookingUpEmployee}
              />
              {lookupHint ? <p className={styles.hintText}>{lookupHint}</p> : null}
            </label>
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
            <RecetaFilterSelect
              id="roleId"
              aria-label="Rol"
              options={roleOptions}
              value={roleId}
              onChange={(value) => {
                setRoleId(value);
                setLocationId('');
              }}
              placeholder="-- Seleccionar rol --"
              theme={theme}
              size="md"
            />
          </label>

          {!isEdit && isOperator ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Sede de planta *</span>
              <RecetaFilterSelect
                id="locationId"
                aria-label="Sede de planta"
                options={locationOptions}
                value={locationId}
                onChange={setLocationId}
                placeholder="-- Seleccionar sede --"
                theme={theme}
                size="md"
              />
            </label>
          ) : null}

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
