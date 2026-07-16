import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { VoidPilaExportInput } from '../types/pila.types';
import { voidPilaExportSchema, type VoidPilaExportSchema } from '../validation/pila.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  isPaid?: boolean;
  onConfirm: (input: VoidPilaExportInput) => Promise<void>;
  onClose: () => void;
}

export function PilaVoidModal({
  open,
  submitting = false,
  isPaid = false,
  onConfirm,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VoidPilaExportSchema>({
    resolver: zodResolver(voidPilaExportSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit = async (values: VoidPilaExportSchema): Promise<void> => {
    try {
      await onConfirm({ reason: values.reason });
      toast.success('Exportación PILA anulada');
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo anular la exportación';
      toast.error(message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) {
          onClose();
        }
      }}
      size="sm"
      theme={modalTheme}
      title="Anular exportación PILA"
      description={
        isPaid
          ? 'Advertencia: esta exportación está PAGADA. Se conservará la evidencia de pago y no se permitirá regenerar automáticamente.'
          : 'El registro permanece en el historial como anulado.'
      }
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        {isPaid ? (
          <p className={styles.error} role="alert">
            Anular una planilla pagada es una acción sensible. Documenta el motivo con claridad.
          </p>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>Motivo de anulación</span>
          <textarea
            {...register('reason')}
            className={styles.textarea}
            rows={4}
            placeholder="Describe el motivo (obligatorio)"
            disabled={submitting}
          />
          {errors.reason ? <span className={styles.error}>{errors.reason.message}</span> : null}
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? 'Anulando…' : 'Confirmar anulación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
