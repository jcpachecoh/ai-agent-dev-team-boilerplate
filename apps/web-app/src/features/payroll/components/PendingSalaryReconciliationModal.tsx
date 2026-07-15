import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { ReconcilePendingSalaryInput } from '../types/final-settlement.types';
import {
  pendingSalaryReconciliationSchema,
  type PendingSalaryReconciliationSchema,
} from '../validation/final-settlement.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  onConfirm: (input: ReconcilePendingSalaryInput) => Promise<void>;
  onClose: () => void;
}

/**
 * OS-591 (fase 4) — registra la reconciliación auditable de salario pendiente exigida por
 * `approve()` cuando la liquidación tiene una línea `SAL_PENDIENTE`. Nunca edita ni oculta
 * la advertencia `pending_salary_double_payment_risk` — solo agrega evidencia adicional.
 */
export function PendingSalaryReconciliationModal({
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
  } = useForm<PendingSalaryReconciliationSchema>({
    resolver: zodResolver(pendingSalaryReconciliationSchema),
    defaultValues: {
      previouslyPaidAmount: '',
      recognizedBalance: '',
      paymentReference: '',
      paymentDate: '',
      responsible: '',
      observation: '',
    },
  });

  const onSubmit = async (values: PendingSalaryReconciliationSchema): Promise<void> => {
    try {
      await onConfirm({
        previouslyPaidAmount: values.previouslyPaidAmount,
        recognizedBalance: values.recognizedBalance,
        paymentReference: values.paymentReference?.trim() || undefined,
        paymentDate: values.paymentDate?.trim() || undefined,
        responsible: values.responsible,
        observation: values.observation,
      });
      toast.success('Reconciliación registrada');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la reconciliación';
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
      size="md"
      theme={modalTheme}
      title="Reconciliar salario pendiente"
      description="Registra la evidencia auditable de pagos previos antes de aprobar esta liquidación."
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Monto previamente pagado</span>
            <input
              {...register('previouslyPaidAmount')}
              className={styles.input}
              inputMode="decimal"
              placeholder="0.00"
              disabled={submitting}
            />
            {errors.previouslyPaidAmount ? (
              <span className={styles.error}>{errors.previouslyPaidAmount.message}</span>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Saldo reconocido</span>
            <input
              {...register('recognizedBalance')}
              className={styles.input}
              inputMode="decimal"
              placeholder="0.00"
              disabled={submitting}
            />
            {errors.recognizedBalance ? (
              <span className={styles.error}>{errors.recognizedBalance.message}</span>
            ) : null}
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Referencia de pago (opcional)</span>
            <input
              {...register('paymentReference')}
              className={styles.input}
              disabled={submitting}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Fecha de pago (opcional)</span>
            <input
              {...register('paymentDate')}
              type="date"
              className={styles.input}
              disabled={submitting}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Responsable</span>
          <input {...register('responsible')} className={styles.input} disabled={submitting} />
          {errors.responsible ? (
            <span className={styles.error}>{errors.responsible.message}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Observación</span>
          <textarea
            {...register('observation')}
            className={styles.textarea}
            rows={3}
            placeholder="Describe la revisión realizada de pagos previos"
            disabled={submitting}
          />
          {errors.observation ? (
            <span className={styles.error}>{errors.observation.message}</span>
          ) : null}
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Registrar reconciliación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
