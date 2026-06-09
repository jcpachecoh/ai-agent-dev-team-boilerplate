import { InventarioFormField, InventarioModal, InventarioSelect, toast } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import {
  useCreateProductionCommittee,
  useOperationsAdminUsers,
} from '../hooks/useProductionCommittees';
import styles from '../produccion.module.scss';

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'No se pudo crear el comité de producción.';
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo (permite crear OPs)' },
] as const;

export interface CreateProductionCommitteeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (committeeId: string) => void;
}

export function CreateProductionCommitteeModal({
  open,
  onClose,
  onCreated,
}: CreateProductionCommitteeModalProps): React.JSX.Element | null {
  const theme = useUiTheme();
  const usersQuery = useOperationsAdminUsers();
  const createMutation = useCreateProductionCommittee();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('ACTIVE');

  useEffect(() => {
    if (open) {
      setSelectedUserIds([]);
      setStatus('ACTIVE');
    }
  }, [open]);

  const users = usersQuery.data ?? [];

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSave = async () => {
    if (selectedUserIds.length < 1) {
      toast.error('Seleccione al menos un administrador de operaciones.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        memberUserIds: selectedUserIds,
        status,
      });
      toast.success(`Comité ${created.number} creado correctamente.`);
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!open) return null;

  return (
    <InventarioModal
      open={open}
      theme={theme}
      size="md"
      title="Nuevo comité de producción"
      subtitle="Asigne usuarios."
      onClose={onClose}
      onSave={() => void handleSave()}
      saveLabel={createMutation.isPending ? 'Creando…' : 'Crear comité'}
      saveLoading={createMutation.isPending}
      saveDisabled={usersQuery.isPending || users.length === 0}
      saveAccent="orange"
    >
      {usersQuery.isPending && (
        <InventoryScreenState
          variant="loading"
          message="Cargando administradores de operaciones…"
        />
      )}

      {usersQuery.isError && (
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(usersQuery.error)}
        </div>
      )}

      {usersQuery.isSuccess && users.length === 0 && (
        <InventoryScreenState
          variant="empty"
          message="No hay usuarios con rol OPERATIONS_ADMIN. Cree usuarios con ese rol antes de abrir un comité."
        />
      )}

      {users.length > 0 && (
        <div className={styles.modalFormGrid}>
          <InventarioFormField
            theme={theme}
            size="md"
            label="Estado inicial"
            inputType="select"
            bareControl
          >
            <InventarioSelect
              theme={theme}
              size="md"
              value={status}
              onChange={(value) => setStatus(value as 'DRAFT' | 'ACTIVE')}
              options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              aria-label="Estado inicial del comité"
            />
          </InventarioFormField>

          <div className={styles.formGridWide}>
            <p className={styles.hint}>Miembros del comité</p>
            <ul className={styles.memberCheckboxList}>
              {users.map((user) => (
                <li key={user.userId}>
                  <label className={styles.memberCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.userId)}
                      onChange={() => toggleUser(user.userId)}
                    />
                    <span>{user.email}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </InventarioModal>
  );
}
