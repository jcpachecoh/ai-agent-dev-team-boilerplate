import { Button, Modal, RolTextarea, toast } from '@restopsiq/ui';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTheme } from '@/providers/ThemeProvider';

import type { LeaveStatus } from '../types/medical-leaves.types';
import styles from './MedicalLeaveRejectModal.module.scss';

const schema = z.object({
  rejectionReason: z.string().trim().min(3, 'Indica el motivo del rechazo'),
});

type FormValues = z.infer<typeof schema>;

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
    defaultValues: { rejectionReason: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      await onConfirm(values.rejectionReason);
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
          <span className={styles.label}>Motivo del rechazo</span>
          <Controller
            name="rejectionReason"
            control={control}
            render={({ field }) => (
              <RolTextarea
                theme={modalTheme}
                size="md"
                rows={4}
                placeholder="Describe el motivo del rechazo"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={pending}
                aria-label="Motivo del rechazo"
              />
            )}
          />
          {errors.rejectionReason ? (
            <span className={styles.error}>{errors.rejectionReason.message}</span>
          ) : null}
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
