import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@restopsiq/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './FinalSettlementManualModal.module.scss';
import type { CreateManualFinalSettlementInput } from '../types/final-settlement.types';
import {
  manualSettlementFormSchema,
  type ManualSettlementFormSchema,
} from '../validation/final-settlement.schema';

interface Props {
  open: boolean;
  submitting?: boolean;
  onConfirm: (
    input: Omit<
      CreateManualFinalSettlementInput,
      'employeeDetailsId' | 'effectiveTerminationDate' | 'terminationReason'
    >,
  ) => Promise<void>;
  onClose: () => void;
}

const EMPTY_LINE = {
  code: '',
  name: '',
  type: 'DEVENGO' as const,
  amount: '',
  manualJustification: '',
};

/**
 * OS-591 (fase 4) — liquidación manual: cada línea es obligatoriamente auditable (el
 * backend rechaza cualquier línea sin `manualJustification`, ver
 * `FinalSettlementService.createManual`). El `contractId` NO se pide aquí — el backend lo
 * resuelve server-side por el contrato ACTIVO del empleado (tasks/OS-591.md §15.10).
 */
export function FinalSettlementManualModal({
  open,
  submitting = false,
  onConfirm,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualSettlementFormSchema>({
    resolver: zodResolver(manualSettlementFormSchema),
    defaultValues: {
      lines: [EMPTY_LINE],
      manualJustification: '',
      manualReference: '',
      manualResponsible: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const onSubmit = async (values: ManualSettlementFormSchema): Promise<void> => {
    try {
      await onConfirm(values);
      toast.success('Liquidación manual registrada');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la liquidación manual';
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
      size="lg"
      theme={modalTheme}
      title="Liquidación manual"
      description="Cada línea debe tener una justificación auditable. Úsala cuando el cálculo automático no aplica."
      onInteractOutside={(event) => {
        if (submitting) {
          event.preventDefault();
        }
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className={styles.lines}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.lineRow}>
              <div className={styles.lineGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Código</span>
                  <input
                    {...register(`lines.${index}.code`)}
                    className={styles.input}
                    placeholder="AJUSTE_MANUAL"
                    disabled={submitting}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Nombre</span>
                  <input
                    {...register(`lines.${index}.name`)}
                    className={styles.input}
                    placeholder="Ajuste acordado"
                    disabled={submitting}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Tipo</span>
                  <select
                    {...register(`lines.${index}.type`)}
                    className={styles.input}
                    disabled={submitting}
                  >
                    <option value="DEVENGO">Devengo</option>
                    <option value="DEDUCCION">Deducción</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Monto</span>
                  <input
                    {...register(`lines.${index}.amount`)}
                    className={styles.input}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Justificación de la línea</span>
                <input
                  {...register(`lines.${index}.manualJustification`)}
                  className={styles.input}
                  placeholder="Acuerdo documentado, acta firmada, etc."
                  disabled={submitting}
                />
              </label>

              {errors.lines?.[index] ? (
                <span className={styles.error}>
                  {[
                    errors.lines[index]?.code?.message,
                    errors.lines[index]?.name?.message,
                    errors.lines[index]?.amount?.message,
                    errors.lines[index]?.manualJustification?.message,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => remove(index)}
                disabled={submitting || fields.length <= 1}
                aria-label="Eliminar línea"
              >
                <Trash2 size={14} aria-hidden />
                Eliminar línea
              </button>
            </div>
          ))}

          <button
            type="button"
            className={styles.addButton}
            onClick={() => append(EMPTY_LINE)}
            disabled={submitting}
          >
            <Plus size={14} aria-hidden />
            Agregar línea
          </button>
          {errors.lines?.root ? (
            <span className={styles.error}>{errors.lines.root.message}</span>
          ) : null}
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Justificación general</span>
          <textarea
            {...register('manualJustification')}
            className={styles.textarea}
            rows={3}
            disabled={submitting}
          />
          {errors.manualJustification ? (
            <span className={styles.error}>{errors.manualJustification.message}</span>
          ) : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Referencia</span>
            <input
              {...register('manualReference')}
              className={styles.input}
              placeholder="Acta, documento de soporte"
              disabled={submitting}
            />
            {errors.manualReference ? (
              <span className={styles.error}>{errors.manualReference.message}</span>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Responsable</span>
            <input
              {...register('manualResponsible')}
              className={styles.input}
              disabled={submitting}
            />
            {errors.manualResponsible ? (
              <span className={styles.error}>{errors.manualResponsible.message}</span>
            ) : null}
          </label>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Registrar liquidación manual'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
