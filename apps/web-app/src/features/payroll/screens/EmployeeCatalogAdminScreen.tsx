import {
  CargoActionButton,
  CargoPage,
  CargoPageHeader,
  CargoPageSection,
  EmptyState,
  LoadingState,
  toast,
} from '@restopsiq/ui';
import { Pencil, Power, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { isPayrollReadOnlyRole } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import { PayrollApiError } from '../api/payroll.client';
import {
  useCreateEmployeeCatalogOptionMutation,
  useDeactivateEmployeeCatalogOptionMutation,
  useEmployeeCatalogAdminOptions,
  useUpdateEmployeeCatalogOptionMutation,
} from '../hooks/useEmployeeCatalogOptions';
import {
  EMPLOYEE_CATALOG_TYPE_LABELS,
  EMPLOYEE_CATALOG_TYPES,
  type EmployeeCatalogOption,
  type EmployeeCatalogType,
} from '../types/employee-catalog.types';
import styles from './EmployeeCatalogAdminScreen.module.scss';

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

type EditorMode = 'create' | 'rename' | null;

/**
 * OS-606 Task-06A — administración de EmployeeCatalogOption (OVERTIME_REASON por defecto).
 * Fuera de la bandeja de aprobación; escritura vía PAYROLL_WRITE_ROLES (no overtime.request).
 */
export function EmployeeCatalogAdminScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const cargoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const readOnly = isPayrollReadOnlyRole(roleCode);

  const [type, setType] = useState<EmployeeCatalogType>(EMPLOYEE_CATALOG_TYPES.OVERTIME_REASON);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editing, setEditing] = useState<EmployeeCatalogOption | undefined>();
  const [nameDraft, setNameDraft] = useState('');

  const catalogQuery = useEmployeeCatalogAdminOptions(type);
  const createMutation = useCreateEmployeeCatalogOptionMutation();
  const updateMutation = useUpdateEmployeeCatalogOptionMutation();
  const deactivateMutation = useDeactivateEmployeeCatalogOptionMutation();

  const options = catalogQuery.data ?? [];
  const sorted = useMemo(
    () =>
      [...options].sort((a, b) => {
        if (a.isActive === b.isActive) {
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        }
        return a.isActive === false ? 1 : -1;
      }),
    [options],
  );

  const openCreate = () => {
    setEditorMode('create');
    setEditing(undefined);
    setNameDraft('');
  };

  const openRename = (option: EmployeeCatalogOption) => {
    setEditorMode('rename');
    setEditing(option);
    setNameDraft(option.name);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditing(undefined);
    setNameDraft('');
  };

  const handleSave = async () => {
    const name = nameDraft.trim().replace(/\s+/g, ' ');
    if (!name) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      if (editorMode === 'create') {
        await createMutation.mutateAsync({ type, name });
        toast.success('Opción creada');
      } else if (editorMode === 'rename' && editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: { name } });
        toast.success('Opción actualizada');
      }
      closeEditor();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleToggleActive = async (option: EmployeeCatalogOption) => {
    try {
      if (option.isActive === false) {
        await updateMutation.mutateAsync({ id: option.id, input: { isActive: true } });
        toast.success('Opción reactivada');
        return;
      }
      await deactivateMutation.mutateAsync(option.id);
      toast.success('Opción desactivada (se conserva el historial)');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <CargoPage theme={cargoTheme} className={styles.screen}>
      <CargoPageSection theme={cargoTheme} divider variant="header">
        <CargoPageHeader
          title="Catálogos de nómina"
          subtitle="Motivos de extensión de jornada y demás opciones del tenant"
          theme={cargoTheme}
          primaryAction={
            readOnly ? undefined : (
              <CargoActionButton theme={cargoTheme} label="Crear opción" onClick={openCreate} />
            )
          }
        />
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} divider>
        {readOnly ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol puede consultar el catálogo, pero no crear ni editar opciones.
          </p>
        ) : null}
        <div className={styles.toolbar}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de catálogo</span>
            <select
              className={styles.fieldControl}
              value={type}
              onChange={(event) => setType(event.target.value as EmployeeCatalogType)}
            >
              {(Object.keys(EMPLOYEE_CATALOG_TYPE_LABELS) as EmployeeCatalogType[]).map(
                (catalogType) => (
                  <option key={catalogType} value={catalogType}>
                    {EMPLOYEE_CATALOG_TYPE_LABELS[catalogType]}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className={styles.actions}>
            <CargoActionButton
              theme={cargoTheme}
              label="Actualizar"
              icon={<RefreshCw aria-hidden />}
              onClick={() => void catalogQuery.refetch()}
            />
          </div>
        </div>
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme}>
        {catalogQuery.isLoading ? (
          <LoadingState
            message="Cargando catálogo…"
            theme={cargoTheme === 'dark' ? 'dark' : 'light'}
          />
        ) : null}

        {catalogQuery.isError ? (
          <div className={styles.feedbackState}>
            <EmptyState
              variant="error"
              theme={cargoTheme}
              title="No se pudo cargar el catálogo"
              description={getErrorMessage(catalogQuery.error)}
              action={
                <CargoActionButton
                  theme={cargoTheme}
                  label="Reintentar"
                  icon={<RefreshCw aria-hidden />}
                  onClick={() => void catalogQuery.refetch()}
                />
              }
            />
          </div>
        ) : null}

        {!catalogQuery.isLoading && !catalogQuery.isError && sorted.length === 0 ? (
          <div className={styles.feedbackState}>
            <EmptyState
              theme={cargoTheme}
              title="Sin opciones"
              description={`No hay registros de ${EMPLOYEE_CATALOG_TYPE_LABELS[type]} en este tenant.`}
            />
          </div>
        ) : null}

        {!catalogQuery.isLoading && !catalogQuery.isError && sorted.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  {!readOnly ? <th>Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {sorted.map((option) => {
                  const active = option.isActive !== false;
                  return (
                    <tr key={option.id}>
                      <td>{option.name}</td>
                      <td>
                        <span className={active ? styles.statusActive : styles.statusInactive}>
                          {active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {!readOnly ? (
                        <td>
                          <div className={styles.actions}>
                            <CargoActionButton
                              theme={cargoTheme}
                              size="sm"
                              label="Renombrar"
                              icon={<Pencil aria-hidden size={14} />}
                              onClick={() => openRename(option)}
                            />
                            <CargoActionButton
                              theme={cargoTheme}
                              size="sm"
                              label={active ? 'Desactivar' : 'Activar'}
                              icon={<Power aria-hidden size={14} />}
                              onClick={() => void handleToggleActive(option)}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </CargoPageSection>

      {editorMode ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeEditor}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>
              {editorMode === 'create' ? 'Crear opción' : 'Renombrar opción'}
            </h2>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nombre</span>
              <input
                className={styles.fieldControl}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                maxLength={120}
                autoFocus
              />
            </label>
            <div className={styles.modalActions}>
              <CargoActionButton theme={cargoTheme} label="Cancelar" onClick={closeEditor} />
              <CargoActionButton
                theme={cargoTheme}
                label="Guardar"
                onClick={() => void handleSave()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </CargoPage>
  );
}
