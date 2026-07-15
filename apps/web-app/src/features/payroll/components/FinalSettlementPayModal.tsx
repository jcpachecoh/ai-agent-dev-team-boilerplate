import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { MarkFinalSettlementPaidInput } from '../types/final-settlement.types';
import {
  markFinalSettlementPaidSchema,
  type MarkFinalSettlementPaidSchema,
} from '../validation/final-settlement.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  onConfirm: (input: MarkFinalSettlementPaidInput) => Promise<void>;
  onClose: () => void;
}

/** OS-591 (fase 4) — un doble intento de marcar como pagada es SIEMPRE un conflicto (409),
 * no un no-op idempotente (ver tasks/OS-591.md §15.9 punto 4) — el error se muestra tal
 * cual lo devuelve el backend, sin reintentar automáticamente. */
export function FinalSettlementPayModal({
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
  } = useForm<MarkFinalSettlementPaidSchema>({
    resolver: zodResolver(markFinalSettlementPaidSchema),
    defaultValues: { paymentReference: '', paymentDate: '' },
  });

  const onSubmit = async (values: MarkFinalSettlementPaidSchema): Promise<void> => {
    try {
      await onConfirm(values);
      toast.success('Liquidación marcada como pagada');
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
      title="Marcar liquidación como pagada"
      description="Registra el comprobante y la fecha real en que se ejecutó el pago."
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <label className={styles.field}>
          <span className={styles.label}>Referencia de pago</span>
          <input
            {...register('paymentReference')}
            className={styles.input}
            placeholder="Número de comprobante o transferencia"
            disabled={submitting}
          />
          {errors.paymentReference ? (
            <span className={styles.error}>{errors.paymentReference.message}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Fecha de pago</span>
          <input
            {...register('paymentDate')}
            type="date"
            className={styles.input}
            disabled={submitting}
          />
          {errors.paymentDate ? (
            <span className={styles.error}>{errors.paymentDate.message}</span>
          ) : null}
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
