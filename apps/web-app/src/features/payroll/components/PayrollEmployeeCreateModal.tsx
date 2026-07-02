import type { PayrollEmployeeCreateWizardPayload } from '../types/payroll-employee-create-wizard.types';
import { PayrollEmployeeCreateWizard } from './PayrollEmployeeCreateWizard';

interface PayrollEmployeeCreateModalProps {
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (payload: PayrollEmployeeCreateWizardPayload) => void;
}

export function PayrollEmployeeCreateModal({
  open,
  submitting,
  theme = 'dark',
  onClose,
  onSubmit,
}: PayrollEmployeeCreateModalProps): React.JSX.Element | null {
  return (
    <PayrollEmployeeCreateWizard
      open={open}
      submitting={submitting}
      theme={theme}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
