import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import { useLocations } from '@/features/sedes/hooks/useLocations';
import { getErrorMessage } from '@/lib/graphql-client';

import { useAssignDailyCostCenterManualMutation } from '../hooks/useDailyCostCenterMutations';

interface Props {
  open: boolean;
  employeeId: string;
  date: string;
  suggestedLocationId?: string | null;
  theme: 'light' | 'dark';
  onClose: () => void;
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

export function AssignRotanteSedeModal({
  open,
  employeeId,
  date,
  suggestedLocationId,
  theme,
  onClose,
}: Props): React.JSX.Element {
  const locationsQuery = useLocations();
  const mutation = useAssignDailyCostCenterManualMutation(employeeId);
  const [locationId, setLocationId] = useState(suggestedLocationId ?? '');

  useEffect(() => {
    if (open) {
      setLocationId(suggestedLocationId ?? '');
    }
  }, [open, suggestedLocationId]);

  const locationOptions = (locationsQuery.data ?? [])
    .filter((location) => location.isActive !== false)
    .map((location) => ({ value: location.id, label: location.name }));

  const handleSubmit = async () => {
    if (!locationId) {
      toast.error('Selecciona una sede');
      return;
    }
    try {
      await mutation.mutateAsync({ date, locationId });
      toast.success(`Sede asignada para ${formatDateLabel(date)}`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      theme={theme}
      title="Asignar sede del día"
      description={formatDateLabel(date)}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando...' : 'Asignar'}
          </Button>
        </>
      }
    >
      <label>
        <span>Áreas (sede)</span>
        <RecetaFilterSelect
          aria-label="Áreas"
          options={locationOptions}
          value={locationId}
          disabled={locationsQuery.isLoading}
          placeholder={locationsQuery.isLoading ? 'Cargando áreas...' : 'Seleccionar área'}
          onChange={setLocationId}
          theme={theme}
          size="md"
        />
      </label>
    </Modal>
  );
}
