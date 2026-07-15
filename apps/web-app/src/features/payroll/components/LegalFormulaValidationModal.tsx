import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './PendingSalaryReconciliationModal.module.scss';
import type { ValidateLegalFormulaInput } from '../types/final-settlement.types';
import {
  legalFormulaValidationSchema,
  type LegalFormulaValidationSchema,
} from '../validation/final-settlement.schema';

interface Props {
  open: boolean;
  formulaVersion: number;
  submitting?: boolean;
  onConfirm: (input: ValidateLegalFormulaInput) => Promise<void>;
  onClose: () => void;
}

/**
 * OS-591 (fase 4) — deja constancia de que el equipo legal revisó la versión de fórmula de
 * indemnización usada en esta liquidación automática — gate de `approve()` cuando la
 * liquidación tiene una línea `INDEMNIZACION` en modo AUTOMATIC.
 */
export function LegalFormulaValidationModal({
  open,
  formulaVersion,
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
  } = useForm<LegalFormulaValidationSchema>({
    resolver: zodResolver(legalFormulaValidationSchema),
    defaultValues: { legalReference: '', observations: '' },
  });

  const onSubmit = async (values: LegalFormulaValidationSchema): Promise<void> => {
    try {
      await onConfirm({
        formulaVersion,
        legalReference: values.legalReference,
        observations: values.observations?.trim() || undefined,
      });
      toast.success('Fórmula legal validada');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo validar la fórmula';
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
      title="Validar fórmula legal de indemnización"
      description={`Versión de fórmula ${formulaVersion} usada en esta liquidación.`}
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <label className={styles.field}>
          <span className={styles.label}>Referencia legal</span>
          <input
            {...register('legalReference')}
            className={styles.input}
            placeholder="Concepto jurídico, norma o acta de revisión"
            disabled={submitting}
          />
          {errors.legalReference ? (
            <span className={styles.error}>{errors.legalReference.message}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Observaciones (opcional)</span>
          <textarea
            {...register('observations')}
            className={styles.textarea}
            rows={3}
            disabled={submitting}
          />
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Validar fórmula'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
