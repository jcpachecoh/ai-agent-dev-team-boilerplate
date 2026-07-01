import { useState } from 'react';
import { EmpleadoModal } from '@restopsiq/ui';

import type { PayrollEmployee, PayrollEmployeeFormValues } from '../types/payroll.types';
import { EmployeePhotoUploader } from './EmployeePhotoUploader';
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
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);

  if (!employee) return null;

  const employeeWithPhoto: PayrollEmployee = localPhotoUrl
    ? { ...employee, photoUrl: localPhotoUrl }
    : employee;

  return (
    <EmpleadoModal
      open={open}
      title="Editar empleado"
      subtitle={employee.name}
      theme={theme}
      onClose={onClose}
    >
      <EmployeePhotoUploader employee={employeeWithPhoto} onPhotoUpdated={setLocalPhotoUrl} />
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
