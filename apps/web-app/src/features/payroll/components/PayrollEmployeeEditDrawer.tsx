import type { PayrollEmployee } from '../types/payroll.types';
import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import { PayrollEmployeeWizard } from './PayrollEmployeeWizard';

interface PayrollEmployeeEditDrawerProps {
  employee?: PayrollEmployee;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (payload: PayrollEmployeeCreateWizardPayload) => void;
}

export function PayrollEmployeeEditDrawer({
  employee,
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeEditDrawerProps): React.JSX.Element | null {
  return (
    <PayrollEmployeeWizard
      mode="edit"
      open={open}
      employee={employee}
      submitting={submitting}
      theme={theme}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
