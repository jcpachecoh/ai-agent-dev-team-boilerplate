import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import { PayrollEmployeeWizard } from './PayrollEmployeeWizard';

interface PayrollEmployeeCreateWizardProps {
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (payload: PayrollEmployeeCreateWizardPayload) => void;
}

export function PayrollEmployeeCreateWizard({
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeCreateWizardProps): React.JSX.Element | null {
  return (
    <PayrollEmployeeWizard
      mode="create"
      open={open}
      submitting={submitting}
      theme={theme}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
