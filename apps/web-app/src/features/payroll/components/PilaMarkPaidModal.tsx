import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { MarkPilaExportPaidInput } from '../types/pila.types';
import { markPilaExportPaidSchema, type MarkPilaExportPaidSchema } from '../validation/pila.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  onConfirm: (input: MarkPilaExportPaidInput) => Promise<void>;
  onClose: () => void;
}

export function PilaMarkPaidModal({
  open,
  submitting = false,
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
  } = useForm<MarkPilaExportPaidSchema>({
    resolver: zodResolver(markPilaExportPaidSchema),
    defaultValues: { planNumber: '', paymentReference: '', paidAt: '' },
  });

  const onSubmit = async (values: MarkPilaExportPaidSchema): Promise<void> => {
    try {
      await onConfirm({
        planNumber: values.planNumber,
        paymentReference: values.paymentReference || undefined,
        paidAt: new Date(`${values.paidAt}T12:00:00.000Z`).toISOString(),
      });
      toast.success('Exportación PILA marcada como pagada');
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar el pago';
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
      title="Marcar PILA como pagada"
      description="Confirmación manual del pago en el operador. No se llama a Aportes en Línea."
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <label className={styles.field}>
          <span className={styles.label}>Número de planilla</span>
          <input
            {...register('planNumber')}
            className={styles.input}
            placeholder="Ej. PL-2026-000123"
            disabled={submitting}
          />
          {errors.planNumber ? (
            <span className={styles.error}>{errors.planNumber.message}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Referencia de pago (opcional)</span>
          <input
            {...register('paymentReference')}
            className={styles.input}
            placeholder="Comprobante o transferencia"
            disabled={submitting}
          />
          {errors.paymentReference ? (
            <span className={styles.error}>{errors.paymentReference.message}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Fecha de pago</span>
          <input
            {...register('paidAt')}
            type="date"
            className={styles.input}
            disabled={submitting}
          />
          {errors.paidAt ? <span className={styles.error}>{errors.paidAt.message}</span> : null}
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Confirmar pago'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
