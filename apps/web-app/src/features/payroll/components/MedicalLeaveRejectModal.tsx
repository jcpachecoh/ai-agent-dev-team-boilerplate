import { Button, Modal, RecetaFilterSelect, RolTextarea, toast } from '@restopsiq/ui';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTheme } from '@/providers/ThemeProvider';

import type { LeaveStatus } from '../types/medical-leaves.types';
import styles from './MedicalLeaveRejectModal.module.scss';

/** Catálogo de causales sugeridas de rechazo (NOM-13). */
export const MEDICAL_LEAVE_REJECTION_REASONS = [
  'Documento incorrecto o ilegible',
  'El documento no corresponde al empleado',
  'Las fechas no coinciden con el soporte',
  'Soporte duplicado',
] as const;

const OTHER_REASON = 'OTRO';

const REASON_OPTIONS = [
  ...MEDICAL_LEAVE_REJECTION_REASONS.map((reason) => ({ value: reason, label: reason })),
  { value: OTHER_REASON, label: 'Otro motivo' },
];

const schema = z
  .object({
    reasonCode: z.string().min(1, 'Selecciona una causal de rechazo'),
    detail: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.reasonCode === OTHER_REASON && values.detail.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['detail'],
        message: 'Describe el motivo del rechazo',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function composeRejectionReason(values: FormValues): string {
  if (values.reasonCode === OTHER_REASON) return values.detail;
  return values.detail ? `${values.reasonCode}: ${values.detail}` : values.reasonCode;
}

interface Props {
  leaveId: string;
  targetStatus: LeaveStatus;
  busy?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function MedicalLeaveRejectModal({
  leaveId,
  targetStatus,
  busy = false,
  onConfirm,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reasonCode: '', detail: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      await onConfirm(composeRejectionReason(values));
      toast.success('Estado actualizado');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo rechazar la incapacidad';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = busy || submitting;

  return (
    <Modal
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
      size="sm"
      theme={modalTheme}
      title="Rechazar incapacidad"
      description={`Incapacidad ${leaveId.slice(0, 8)}… · Estado destino: ${targetStatus}`}
      onInteractOutside={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className={styles.field}>
          <span className={styles.label}>Causal de rechazo *</span>
          <Controller
            name="reasonCode"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Causal de rechazo"
                options={REASON_OPTIONS}
                value={field.value}
                placeholder="Seleccionar causal"
                onChange={field.onChange}
                disabled={pending}
                theme={modalTheme}
                size="md"
              />
            )}
          />
          {errors.reasonCode ? (
            <span className={styles.error}>{errors.reasonCode.message}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Detalle del motivo</span>
          <Controller
            name="detail"
            control={control}
            render={({ field }) => (
              <RolTextarea
                theme={modalTheme}
                size="md"
                rows={4}
                placeholder="Agrega detalles adicionales del rechazo (obligatorio si eliges Otro motivo)"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={pending}
                aria-label="Detalle del motivo"
              />
            )}
          />
          {errors.detail ? <span className={styles.error}>{errors.detail.message}</span> : null}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? 'Guardando…' : 'Confirmar rechazo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
