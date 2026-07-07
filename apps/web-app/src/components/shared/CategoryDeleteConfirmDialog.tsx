import { Button, Modal } from '@restopsiq/ui';
import type { ReactNode } from 'react';

import type { UiTheme } from '@/constants/theme';

interface CategoryDeleteConfirmDialogProps {
  categoryName?: string;
  description: ReactNode;
  open: boolean;
  submitting?: boolean;
  theme?: UiTheme;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CategoryDeleteConfirmDialog({
  categoryName,
  description,
  open,
  submitting,
  theme = 'dark',
  onCancel,
  onConfirm,
}: CategoryDeleteConfirmDialogProps): React.JSX.Element | null {
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
      title="Eliminar categoría"
      description={description}
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
          <Button variant="danger" size="medium" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Eliminando...' : 'Confirmar eliminación'}
          </Button>
        </>
      }
    />
  );
}
