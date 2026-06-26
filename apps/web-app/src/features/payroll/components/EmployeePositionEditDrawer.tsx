import { CargoModal } from '@restopsiq/ui';

import { EmployeePositionForm } from './EmployeePositionForm';
import type {
  EmployeePosition,
  EmployeePositionFormValues,
} from '../types/employee-position.types';

interface EmployeePositionEditDrawerProps {
  position?: EmployeePosition;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: EmployeePositionFormValues) => void;
}

export function EmployeePositionEditDrawer({
  position,
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: EmployeePositionEditDrawerProps): React.JSX.Element | null {
  if (!position) {
    return null;
  }

  return (
    <CargoModal
      open={open}
      title="Editar cargo"
      subtitle={position.title}
      theme={theme}
      size="sm"
      onClose={onClose}
    >
      <EmployeePositionForm
        mode="edit"
        initialValues={position}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </CargoModal>
  );
}
