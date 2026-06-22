import { EmpleadoModal } from '@restopsiq/ui';

import type { PayrollEmployee, PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

interface PayrollEmployeeEditDrawerProps {
  employee?: PayrollEmployee;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
}

export function PayrollEmployeeEditDrawer({
  employee,
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeEditDrawerProps): React.JSX.Element | null {
  if (!employee) return null;

  return (
    <EmpleadoModal
      open={open}
      title="Editar empleado"
      subtitle={employee.name}
      theme={theme}
      onClose={onClose}
    >
      <PayrollEmployeeForm
        mode="edit"
        initialValues={employee}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </EmpleadoModal>
  );
}
