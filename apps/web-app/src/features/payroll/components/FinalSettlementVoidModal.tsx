import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { VoidFinalSettlementInput } from '../types/final-settlement.types';
import {
  voidFinalSettlementSchema,
  type VoidFinalSettlementSchema,
} from '../validation/final-settlement.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  onConfirm: (input: VoidFinalSettlementInput) => Promise<void>;
  onClose: () => void;
}

/** OS-591 (fase 4) — anular solo procede en DRAFT/CALCULATED (nunca desde APPROVED en
 * adelante, ya que aprobar dispara la terminación real del contrato). El backend rechaza
 * el resto de los casos con 409; el mensaje se muestra tal cual. */
export function FinalSettlementVoidModal({
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
  } = useForm<VoidFinalSettlementSchema>({
    resolver: zodResolver(voidFinalSettlementSchema),
    defaultValues: { voidReason: '' },
  });

  const onSubmit = async (values: VoidFinalSettlementSchema): Promise<void> => {
    try {
      await onConfirm(values);
      toast.success('Liquidación anulada');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo anular la liquidación';
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
      title="Anular liquidación"
      description="Esta acción no se puede deshacer."
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <label className={styles.field}>
          <span className={styles.label}>Motivo de anulación</span>
          <textarea
            {...register('voidReason')}
            className={styles.textarea}
            rows={4}
            placeholder="Describe el motivo de la anulación"
            disabled={submitting}
          />
          {errors.voidReason ? (
            <span className={styles.error}>{errors.voidReason.message}</span>
          ) : null}
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
