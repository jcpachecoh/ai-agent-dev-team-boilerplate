import { Button, Modal } from '@restopsiq/ui';

import type { UiTheme } from '@/constants/theme';

interface CategoryStatusConfirmDialogProps {
  categoryName?: string;
  isActivating: boolean;
  open: boolean;
  submitting?: boolean;
  theme?: UiTheme;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryStatusConfirmDialog({
  categoryName,
  isActivating,
  open,
  submitting,
  theme = 'dark',
  onCancel,
  onConfirm,
}: CategoryStatusConfirmDialogProps): React.JSX.Element | null {
  if (!categoryName) return null;

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
      title={isActivating ? 'Activar categoría' : 'Desactivar categoría'}
      description={
        isActivating ? (
          <>
            Vas a activar la categoría <strong>{categoryName}</strong>. Volverá a estar disponible
            en los selectores y listados.
          </>
        ) : (
          <>
            Vas a desactivar la categoría <strong>{categoryName}</strong>. Dejará de aparecer en el
            listado por defecto.
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
