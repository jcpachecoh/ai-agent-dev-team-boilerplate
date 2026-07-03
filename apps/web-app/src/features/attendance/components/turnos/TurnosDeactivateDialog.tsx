import { Button, Modal } from '@restopsiq/ui';

import type { Turno } from '../../types/turnos.types';

interface TurnosDeactivateDialogProps {
  turno?: Turno;
  open: boolean;
  submitting?: boolean;
  theme?: 'light' | 'dark';
  onCancel: () => void;
  onConfirm: () => void;
}

export function TurnosDeactivateDialog({
  turno,
  open,
  submitting,
  theme = 'dark',
  onCancel,
  onConfirm,
}: TurnosDeactivateDialogProps): React.JSX.Element | null {
  if (!turno) {
    return null;
  }

  const isActivating = !turno.estado;

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
      title={isActivating ? 'Activar turno' : 'Desactivar turno'}
      description={
        isActivating ? (
          <>
            Vas a activar el turno <strong>{turno.nombre}</strong>. Volverá a estar disponible para
            asignación.
          </>
        ) : (
          <>
            Vas a desactivar el turno <strong>{turno.nombre}</strong>. Si tiene colaboradores con
            asignaciones futuras, la operación será rechazada.
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
