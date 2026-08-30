import { Button, Modal } from '@restopsiq/ui';

import type { PayrollEmployee } from '../types/payroll.types';

interface PayrollDeactivateEmployeeDialogProps {
  employee?: PayrollEmployee;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onCancel: () => void;
  onConfirm: () => void;
}

export function PayrollDeactivateEmployeeDialog({
  employee,
  open,
  submitting,
  theme = 'dark',
  onCancel,
  onConfirm,
}: PayrollDeactivateEmployeeDialogProps): React.JSX.Element | null {
  if (!employee) return null;

  const isActivating = !employee.isActive;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) {
          onCancel();
        }
      }}
      size="md"
      theme={theme}
      title={isActivating ? 'Activar empleado' : 'Desactivar empleado'}
      description={
        isActivating ? (
          <>
            Vas a activar a <strong>{employee.name}</strong>. El empleado volverá a aparecer en el
            listado por defecto.
          </>
        ) : (
          <>
            Vas a desactivar a <strong>{employee.name}</strong>. Este cambio aplica soft delete y el
            empleado dejará de aparecer en el listado por defecto.
          </>
        )
      }
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant={isActivating ? 'primary' : 'danger'}
            size="medium"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting
              ? isActivating
                ? 'Activando...'
                : 'Desactivando...'
              : isActivating
                ? 'Confirmar activación'
                : 'Confirmar desactivación'}
          </Button>
        </>
      }
    />
  );
}
