import { CargoModal } from '@restopsiq/ui';

import type { TurnoFormValues } from '../../types/turnos.types';
import { TurnosForm } from './TurnosForm';

interface TurnosCreateModalProps {
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: TurnoFormValues) => void;
}

export function TurnosCreateModal({
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: TurnosCreateModalProps): React.JSX.Element | null {
  return (
    <CargoModal
      open={open}
      title="Crear turno"
      subtitle="Configura un nuevo turno de asistencia"
      theme={theme}
      size="md"
      onClose={onClose}
    >
      <TurnosForm mode="create" submitting={submitting} onCancel={onClose} onSubmit={onSubmit} />
    </CargoModal>
  );
}
