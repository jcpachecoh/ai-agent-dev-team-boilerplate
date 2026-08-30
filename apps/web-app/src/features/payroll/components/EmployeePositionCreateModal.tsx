import { CargoModal } from '@restopsiq/ui';

import { EmployeePositionForm } from './EmployeePositionForm';
import type { EmployeePositionFormValues } from '../types/employee-position.types';

interface EmployeePositionCreateModalProps {
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: EmployeePositionFormValues) => void;
}

export function EmployeePositionCreateModal({
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: EmployeePositionCreateModalProps): React.JSX.Element | null {
  return (
    <CargoModal
      open={open}
      title="Nuevo cargo"
      subtitle="Registra un cargo en el catálogo de nómina"
      theme={theme}
      size="sm"
      onClose={onClose}
    >
      <EmployeePositionForm
        mode="create"
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </CargoModal>
  );
}
