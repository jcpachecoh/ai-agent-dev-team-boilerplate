import {
  RecetaFormButton,
  RolCheckbox,
  RolFormField,
  RolModal,
  RolTextInput,
  RolTextarea,
} from '@restopsiq/ui';
import { useEffect, useId, useState, type JSX } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

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
  const { theme } = useTheme();
  const codeId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const activeId = useId();

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
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
    <RolModal
      open={open}
      title={isEdit ? `Editar rol: ${role?.code}` : 'Nuevo rol'}
      subtitle={
        isEdit ? 'Modifica nombre, descripción o estado del rol' : 'Define código y nombre del rol'
      }
      theme={theme}
      onClose={onClose}
      closeLabel="Cerrar"
      footer={
        <>
          <RecetaFormButton
            variant="cancel"
            label="Cancelar"
            theme={theme}
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear rol'}
            theme={theme}
            onClick={handleSave}
            disabled={saving}
          />
        </>
      }
    >
      <div className={styles.body}>
        {!isEdit ? (
          <RolFormField label="Código * (UPPER_SNAKE_CASE)" htmlFor={codeId} theme={theme}>
            <RolTextInput
              id={codeId}
              theme={theme}
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Ej: NUEVO_ROL"
            />
          </RolFormField>
        ) : null}

        <RolFormField label="Nombre *" htmlFor={nameId} theme={theme}>
          <RolTextInput
            id={nameId}
            theme={theme}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Nuevo Rol"
          />
        </RolFormField>

        <RolFormField label="Descripción (opcional)" htmlFor={descriptionId} theme={theme}>
          <RolTextarea
            id={descriptionId}
            theme={theme}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción del rol y sus responsabilidades"
          />
        </RolFormField>

        {isEdit ? (
          <RolCheckbox
            id={activeId}
            theme={theme}
            label="Rol activo"
            checked={isActive}
            onChange={setIsActive}
          />
        ) : null}

        {error ? <p className={styles.errorText}>{error}</p> : null}
      </div>
    </RolModal>
  );
}
