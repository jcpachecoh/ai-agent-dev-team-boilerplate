import { EmpleadoModal } from '@restopsiq/ui';

import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

interface PayrollEmployeeCreateModalProps {
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
}

export function PayrollEmployeeCreateModal({
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeCreateModalProps): React.JSX.Element | null {
  return (
    <EmpleadoModal
      open={open}
      title="Nuevo empleado"
      subtitle="Registro base de empleado en employeeDetails"
      theme={theme}
      onClose={onClose}
      showCloseButton={false}
    >
      <PayrollEmployeeForm
        mode="create"
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </EmpleadoModal>
  );
}
