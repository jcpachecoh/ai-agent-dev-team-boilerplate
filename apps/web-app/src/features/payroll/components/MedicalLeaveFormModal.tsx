import { Button, Combobox, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTheme } from '@/providers/ThemeProvider';

import { useMedicalLeaveMutations } from '../hooks/useMedicalLeaveMutations';
import { useActivePayrollEmployeesQuery } from '../hooks/useActivePayrollEmployeesQuery';
import type {
  LeaveOrigin,
  ListMedicalLeavesFilters,
  MedicalLeaveDetail,
} from '../types/medical-leaves.types';
import { LEAVE_ORIGIN_LABELS } from '../utils/medical-leaves-display';
import {
  medicalLeaveFormSchema,
  type MedicalLeaveFormSchema,
} from '../validation/medical-leave.schema';
import { MedicalLeave180DayBanner } from './MedicalLeave180DayBanner';
import { MedicalLeaveSplitPreview } from './MedicalLeaveSplitPreview';
import { MedicalLeaveSupportFileUpload } from './MedicalLeaveSupportFileUpload';
import styles from './MedicalLeaveFormModal.module.scss';

function filterEmployeeOptions(
  options: { value: string; label: string }[],
  query: string,
): { value: string; label: string }[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

/** Abre el date picker nativo al hacer clic en cualquier parte del campo de fecha. */
function openDatePicker(event: React.MouseEvent<HTMLInputElement>): void {
  const input = event.currentTarget;
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
    } catch {
      // showPicker puede lanzar si el input no está activo; se ignora sin romper el clic.
    }
  }
}

type FormValues = MedicalLeaveFormSchema;

const schema = medicalLeaveFormSchema;

const ORIGIN_OPTIONS = [
  { value: 'COMUN', label: LEAVE_ORIGIN_LABELS.COMUN },
  { value: 'LABORAL', label: LEAVE_ORIGIN_LABELS.LABORAL },
];

interface Props {
  open: boolean;
  listFilters: ListMedicalLeavesFilters;
  onClose: () => void;
  onCreated?: (leave: MedicalLeaveDetail) => void;
}

export function MedicalLeaveFormModal({
  open,
  listFilters,
  onClose,
  onCreated,
}: Props): React.JSX.Element | null {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdLeave, setCreatedLeave] = useState<MedicalLeaveDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const employeesQuery = useActivePayrollEmployeesQuery();
  const { registerMutation, uploadSupportMutation } = useMedicalLeaveMutations(listFilters);

  const employeeOptions = useMemo(
    () =>
      (employeesQuery.data ?? [])
        .filter((employee) => employee.id && employee.name)
        .map((employee) => ({
          value: employee.id,
          label: employee.name,
        })),
    [employeesQuery.data],
  );

  const employeeSelectOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, employeeSearch),
    [employeeOptions, employeeSearch],
  );

  const employeePlaceholder = employeesQuery.isLoading
    ? 'Cargando empleados…'
    : employeesQuery.isError
      ? 'No se pudieron cargar empleados'
      : employeeOptions.length === 0
        ? 'Sin empleados activos'
        : 'Seleccionar';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      origin: 'COMUN',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setStep('form');
    setCreatedLeave(null);
    setSelectedFile(null);
    setFileError(null);
    setUploadResetKey((current) => current + 1);
    setEmployeeSearch('');
    reset({
      employeeId: '',
      origin: 'COMUN',
      startDate: '',
      endDate: '',
    });
  }, [open, reset]);

  const busy = registerMutation.isPending || uploadSupportMutation.isPending;

  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadResetKey((current) => current + 1);
  };

  const onSubmit = async (values: FormValues) => {
    // El soporte médico es obligatorio: sin archivo no se crea la novedad.
    if (!selectedFile) {
      setFileError('El soporte médico es obligatorio para registrar la incapacidad');
      return;
    }

    try {
      const created = await registerMutation.mutateAsync({
        employeeId: values.employeeId,
        origin: values.origin as LeaveOrigin,
        startDate: values.startDate,
        endDate: values.endDate,
      });

      const finalLeave = {
        ...created,
        ...(await uploadSupportMutation.mutateAsync({ id: created.id, file: selectedFile })),
      };
      clearFile();

      setCreatedLeave(finalLeave);
      setStep('success');
      onCreated?.(finalLeave);
      toast.success('Incapacidad registrada');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la incapacidad';
      toast.error(message);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
      size="md"
      theme={modalTheme}
      title={step === 'form' ? 'Registrar incapacidad' : 'Incapacidad registrada'}
      description={
        step === 'form'
          ? 'Completa los datos para calcular el split empleador / EPS-ARL.'
          : 'Revisa el desglose calculado y adjunta el soporte médico si lo tienes disponible.'
      }
      onInteractOutside={(event) => {
        // El date picker nativo se renderiza fuera del DOM del diálogo; si no se
        // previene, Radix lo interpreta como clic externo y cierra el modal.
        event.preventDefault();
      }}
    >
      {step === 'form' ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            if (!selectedFile) {
              setFileError('El soporte médico es obligatorio para registrar la incapacidad');
            }
            void handleSubmit(onSubmit)(event);
          }}
        >
          <label className={styles.field}>
            <span className={styles.label}>Empleado</span>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  options={employeeSelectOptions}
                  onChange={(value) => field.onChange(typeof value === 'string' ? value : '')}
                  onSearch={setEmployeeSearch}
                  placeholder={employeePlaceholder}
                  searchPlaceholder="Buscar empleado…"
                  theme={modalTheme}
                  size="md"
                  className={styles.control}
                  loading={employeesQuery.isLoading}
                />
              )}
            />
            {errors.employeeId ? (
              <span className={styles.error}>{errors.employeeId.message}</span>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Origen</span>
            <Controller
              name="origin"
              control={control}
              render={({ field }) => (
                <RecetaFilterSelect
                  value={field.value}
                  options={ORIGIN_OPTIONS}
                  onChange={field.onChange}
                  theme={modalTheme}
                  size="md"
                  id="medical-leave-origin"
                />
              )}
            />
          </label>

          <div className={styles.dateRow}>
            <label className={styles.field} htmlFor="medical-leave-start-date">
              <span className={styles.label}>Fecha inicio</span>
              <input
                id="medical-leave-start-date"
                type="date"
                className={styles.input}
                {...register('startDate')}
                onClick={openDatePicker}
              />
              {errors.startDate ? (
                <span className={styles.error}>{errors.startDate.message}</span>
              ) : null}
            </label>
            <label className={styles.field} htmlFor="medical-leave-end-date">
              <span className={styles.label}>Fecha fin</span>
              <input
                id="medical-leave-end-date"
                type="date"
                className={styles.input}
                {...register('endDate')}
                onClick={openDatePicker}
              />
              {errors.endDate ? (
                <span className={styles.error}>{errors.endDate.message}</span>
              ) : null}
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Soporte médico *</span>
            <MedicalLeaveSupportFileUpload
              resetKey={uploadResetKey}
              disabled={busy}
              error={fileError}
              description="Requerido para registrar · PDF, JPG o PNG · máximo 10 MB"
              onErrorChange={setFileError}
              onChange={setSelectedFile}
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Registrando…' : 'Registrar'}
            </Button>
          </div>
        </form>
      ) : createdLeave ? (
        <div className={styles.success}>
          {createdLeave.exceeds180DayThreshold ? (
            <MedicalLeave180DayBanner annualAccumulatedDays={createdLeave.annualAccumulatedDays} />
          ) : null}
          <MedicalLeaveSplitPreview
            leave={createdLeave}
            annualAccumulatedDays={createdLeave.annualAccumulatedDays}
          />

          <p className={styles.successNote}>Soporte médico adjuntado correctamente.</p>

          <div className={styles.actions}>
            <Button type="button" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
