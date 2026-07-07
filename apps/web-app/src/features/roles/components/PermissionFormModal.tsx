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

import type { PermissionCatalogItem, PermissionFormValues } from '../types';
import styles from './RoleFormModal.module.scss';

export type PermissionFormMode = 'create' | 'edit';

interface CreatePermissionProps {
  mode: 'create';
  permission?: undefined;
  onSave: (values: PermissionFormValues & { code: string }) => void;
}

interface EditPermissionProps {
  mode: 'edit';
  permission: PermissionCatalogItem;
  onSave: (values: PermissionFormValues) => void;
}

type PermissionFormModalProps = (CreatePermissionProps | EditPermissionProps) & {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
};

export function PermissionFormModal({
  open,
  mode,
  permission,
  saving = false,
  onClose,
  onSave,
}: PermissionFormModalProps): JSX.Element | null {
  const { theme } = useTheme();
  const codeId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const moduleId = useId();
  const resourceId = useId();
  const actionId = useId();
  const activeId = useId();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit && permission) {
      setCode(permission.code);
      setName(permission.name);
      setDescription(permission.description ?? '');
      setModule(permission.module ?? '');
      setResource(permission.resource ?? '');
      setAction(permission.action ?? '');
      setIsActive(permission.isActive);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setModule('');
      setResource('');
      setAction('');
      setIsActive(true);
    }
  }, [open, isEdit, permission]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre del permiso es obligatorio.');
      return;
    }
    if (!isEdit && !code.trim()) {
      setError('El código del permiso es obligatorio.');
      return;
    }
    setError(null);

    const values: PermissionFormValues = {
      name: name.trim(),
      description: description.trim() || undefined,
      module: module.trim() || undefined,
      resource: resource.trim() || undefined,
      action: action.trim() || undefined,
      isActive,
    };

    if (isEdit) {
      (onSave as (v: PermissionFormValues) => void)(values);
    } else {
      (onSave as (v: PermissionFormValues & { code: string }) => void)({
        ...values,
        code: code.trim(),
      });
    }
  };

  return (
    <RolModal
      open={open}
      title={isEdit ? `Editar permiso: ${permission?.code}` : 'Nuevo permiso'}
      subtitle={
        isEdit
          ? 'Modifica nombre, descripción, clasificación o estado'
          : 'Define código y clasificación del permiso'
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
            label={isEdit ? 'Guardar cambios' : 'Crear permiso'}
            theme={theme}
            onClick={handleSave}
            disabled={saving}
          />
        </>
      }
    >
      <div className={styles.body}>
        {!isEdit ? (
          <RolFormField label="Código * (ej: plant.orders.export)" htmlFor={codeId} theme={theme}>
            <RolTextInput
              id={codeId}
              theme={theme}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="módulo.recurso.acción"
            />
          </RolFormField>
        ) : null}

        <RolFormField label="Nombre *" htmlFor={nameId} theme={theme}>
          <RolTextInput
            id={nameId}
            theme={theme}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Exportar órdenes de producción"
          />
        </RolFormField>

        <RolFormField label="Descripción (opcional)" htmlFor={descriptionId} theme={theme}>
          <RolTextarea
            id={descriptionId}
            theme={theme}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué permite hacer este permiso"
          />
        </RolFormField>

        <RolFormField label="Módulo" htmlFor={moduleId} theme={theme}>
          <RolTextInput
            id={moduleId}
            theme={theme}
            type="text"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            placeholder="Ej: plant, supply, admin"
          />
        </RolFormField>

        <RolFormField label="Recurso" htmlFor={resourceId} theme={theme}>
          <RolTextInput
            id={resourceId}
            theme={theme}
            type="text"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="Ej: orders, items, users"
          />
        </RolFormField>

        <RolFormField label="Acción" htmlFor={actionId} theme={theme}>
          <RolTextInput
            id={actionId}
            theme={theme}
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Ej: read, manage, export"
          />
        </RolFormField>

        {isEdit ? (
          <>
            <RolCheckbox
              id={activeId}
              theme={theme}
              label="Permiso activo"
              checked={isActive}
              onChange={setIsActive}
            />
            {!isActive ? (
              <p className={styles.warnText}>
                Si este permiso está asignado a roles, dejará de tener efecto para todos ellos.
              </p>
            ) : null}
          </>
        ) : (
          <p className={styles.infoText}>
            Este permiso no tendrá efecto hasta que sea asignado a uno o más roles.
          </p>
        )}

        {error ? <p className={styles.errorText}>{error}</p> : null}
      </div>
    </RolModal>
  );
}
