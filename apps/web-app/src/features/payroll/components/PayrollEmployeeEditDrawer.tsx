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

  // #region agent log
  if (open) {
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0046ac' },
      body: JSON.stringify({
        sessionId: '0046ac',
        runId: 'pre-fix',
        hypothesisId: 'C-E',
        location: 'PayrollEmployeeEditDrawer.tsx:render',
        message: 'Edit drawer employee payload',
        data: {
          employeeId: employee.id,
          locationId: employee.locationId,
          locationName: employee.location?.name ?? null,
          open,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

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
