import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, RecetaFormButton, RolTextarea, toast } from '@restopsiq/ui';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { useVacationApprovalMutations } from '@/features/my-profile/hooks/useVacationMutations';
import styles from './VacationRejectModal.module.scss';

const schema = z.object({
  rejectionReason: z.string().trim().min(1, 'El motivo de rechazo es obligatorio'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
}

export function VacationRejectModal({ open, requestId, onClose }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();
  const { reject } = useVacationApprovalMutations();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rejectionReason: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ rejectionReason: '' });
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!requestId) return;
    try {
      await reject.mutateAsync({ requestId, rejectionReason: values.rejectionReason });
      toast.success('Solicitud rechazada');
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof PayrollApiError ? error.message : 'No se pudo rechazar';
      toast.error(message);
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !isSubmitting) onClose();
      }}
      size="md"
      theme={modalTheme}
      className={styles.modalContent}
      title="Rechazar solicitud"
      footer={
        <div className={styles.footer}>
          <RecetaFormButton
            type="button"
            variant="cancel"
            theme={uiTheme}
            label="Cancelar"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <RecetaFormButton
            type="button"
            variant="discard"
            theme={uiTheme}
            label="Rechazar"
            onClick={() => void onSubmit()}
            disabled={isSubmitting || !requestId}
          />
        </div>
      }
    >
      <form className={styles.form} onSubmit={(event) => void onSubmit(event)}>
        <div className={styles.field}>
          <span className={styles.label}>Motivo del rechazo</span>
          <Controller
            name="rejectionReason"
            control={control}
            render={({ field }) => (
              <RolTextarea
                theme={modalTheme}
                rows={4}
                placeholder="Indique el motivo del rechazo"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.rejectionReason ? (
            <span className={styles.error}>{errors.rejectionReason.message}</span>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
