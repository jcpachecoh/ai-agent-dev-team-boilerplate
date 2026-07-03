import { Button, Modal } from '@restopsiq/ui';

import type { EmployeePosition } from '../types/employee-position.types';

interface EmployeePositionDeactivateDialogProps {
  position?: EmployeePosition;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onCancel: () => void;
  onConfirm: () => void;
}

export function EmployeePositionDeactivateDialog({
  position,
  open,
  submitting,
  theme = 'dark',
  onCancel,
  onConfirm,
}: EmployeePositionDeactivateDialogProps): React.JSX.Element | null {
  if (!position) {
    return null;
  }

  const isActivating = !position.isActive;
  const associatedEmployees = position.employeeCount ?? 0;
  const hasAssociatedEmployees = !isActivating && associatedEmployees > 0;

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
      title={isActivating ? 'Activar cargo' : 'Desactivar cargo'}
      description={
        isActivating ? (
          <>
            Vas a activar el cargo <strong>{position.title}</strong>. Volverá a estar disponible
            para asignación en empleados.
          </>
        ) : hasAssociatedEmployees ? (
          <>
            El cargo <strong>{position.title}</strong> tiene <strong>{associatedEmployees}</strong>{' '}
            empleado
            {associatedEmployees === 1 ? '' : 's'} activo
            {associatedEmployees === 1 ? '' : 's'} asociado
            {associatedEmployees === 1 ? '' : 's'}. Si lo desactivas, no podrás asignarlo a nuevos
            empleados hasta reactivarlo.
          </>
        ) : (
          <>
            Vas a desactivar el cargo <strong>{position.title}</strong>. Dejará de aparecer como
            activo en el catálogo.
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
