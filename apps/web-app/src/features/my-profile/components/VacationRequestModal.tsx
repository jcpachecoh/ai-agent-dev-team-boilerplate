import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, RecetaFilterSelect, RecetaFormButton, RecetaTextInput, toast } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import {
  calculateBusinessDaysInRange,
  getMinVacationStartDateString,
  VACATION_MIN_ADVANCE_DAYS,
} from '@/features/payroll/utils/vacation-display.utils';
import type { VacationType } from '@/features/payroll/types/vacations.types';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { useRequestVacationMutation } from '../hooks/useVacationMutations';
import styles from './VacationRequestModal.module.scss';

const TYPE_OPTIONS = [
  { value: 'DISFRUTE', label: 'Disfrute' },
  { value: 'COMPENSACION', label: 'Compensación en dinero' },
];

const schema = z
  .object({
    startDate: z.string().min(1, 'Fecha de inicio requerida'),
    endDate: z.string().min(1, 'Fecha de fin requerida'),
    type: z.enum(['DISFRUTE', 'COMPENSACION']),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'La fecha de fin debe ser posterior o igual al inicio',
    path: ['endDate'],
  })
  .refine((data) => data.startDate >= getMinVacationStartDateString(), {
    message: `La fecha de inicio debe ser al menos ${VACATION_MIN_ADVANCE_DAYS} días después de hoy`,
    path: ['startDate'],
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      calculateBusinessDaysInRange(data.startDate, data.endDate) > 0,
    {
      message: 'El rango debe incluir al menos un día hábil (lunes a viernes)',
      path: ['endDate'],
    },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  employeeId: string | undefined;
  availableDays: number;
  onClose: () => void;
}

export function VacationRequestModal({
  open,
  employeeId,
  availableDays,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();
  const mutation = useRequestVacationMutation(employeeId);

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startDate: '', endDate: '', type: 'DISFRUTE' },
  });

  useEffect(() => {
    if (!open) {
      reset({ startDate: '', endDate: '', type: 'DISFRUTE' });
    }
  }, [open, reset]);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const minStartDate = useMemo(() => getMinVacationStartDateString(), []);
  const daysPreview = useMemo(
    () => (startDate && endDate ? calculateBusinessDaysInRange(startDate, endDate) : 0),
    [startDate, endDate],
  );
  const exceedsBalance = daysPreview > availableDays;

  const onSubmit = handleSubmit(async (values) => {
    if (!employeeId) return;
    try {
      await mutation.mutateAsync({
        startDate: values.startDate,
        endDate: values.endDate,
        type: values.type as VacationType,
      });
      toast.success('Solicitud de vacaciones enviada');
      onClose();
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo crear la solicitud';
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
      title="Solicitar vacaciones"
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
            variant="save"
            theme={uiTheme}
            label="Enviar solicitud"
            onClick={() => void onSubmit()}
            disabled={isSubmitting || !employeeId}
          />
        </div>
      }
    >
      <form className={styles.form} onSubmit={(event) => void onSubmit(event)}>
        <div className={styles.field}>
          <span className={styles.label}>Fecha de inicio</span>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <RecetaTextInput
                type="date"
                theme={uiTheme}
                className={styles.control}
                value={field.value}
                min={minStartDate}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.startDate ? (
            <span className={styles.error}>{errors.startDate.message}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Fecha de fin</span>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <RecetaTextInput
                type="date"
                theme={uiTheme}
                className={styles.control}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.endDate ? <span className={styles.error}>{errors.endDate.message}</span> : null}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Tipo</span>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                size="md"
                theme={uiTheme}
                value={field.value}
                onChange={field.onChange}
                options={TYPE_OPTIONS}
                placeholder="Tipo de vacaciones"
              />
            )}
          />
        </div>

        {daysPreview > 0 ? (
          <p className={styles.preview}>
            Días hábiles solicitados: <strong>{daysPreview}</strong> (no incluye sábados ni
            domingos) · Saldo disponible: <strong>{availableDays}</strong>
          </p>
        ) : null}

        {exceedsBalance ? (
          <p className={styles.warning}>
            La solicitud excede su saldo disponible. El backend validará el saldo al enviar.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
