import { CargoModal } from '@restopsiq/ui';

import type { Turno, TurnoFormValues } from '../../types/turnos.types';
import { TurnosForm } from './TurnosForm';

interface TurnosEditModalProps {
  turno?: Turno;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: TurnoFormValues) => void;
}

export function TurnosEditModal({
  turno,
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: TurnosEditModalProps): React.JSX.Element | null {
  if (!turno) {
    return null;
  }

  return (
    <CargoModal
      open={open}
      title="Editar turno"
      subtitle={`Modifica la configuración de ${turno.nombre}`}
      theme={theme}
      size="md"
      onClose={onClose}
    >
      <TurnosForm
        mode="edit"
        initialValues={turno}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </CargoModal>
  );
}
