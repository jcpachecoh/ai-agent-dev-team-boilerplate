import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
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
    try {
      const created = await registerMutation.mutateAsync({
        employeeId: values.employeeId,
        origin: values.origin as LeaveOrigin,
        startDate: values.startDate,
        endDate: values.endDate,
      });

      let finalLeave = created;
      if (selectedFile) {
        finalLeave = {
          ...created,
          ...(await uploadSupportMutation.mutateAsync({ id: created.id, file: selectedFile })),
        };
        clearFile();
      }

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

  const handleUploadSupport = async () => {
    if (!createdLeave || !selectedFile) {
      setFileError('Selecciona un archivo de soporte');
      return;
    }
    try {
      const updated = await uploadSupportMutation.mutateAsync({
        id: createdLeave.id,
        file: selectedFile,
      });
      setCreatedLeave({ ...createdLeave, ...updated });
      toast.success('Soporte médico adjuntado');
      clearFile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo adjuntar el soporte';
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
        if (busy) event.preventDefault();
      }}
    >
      {step === 'form' ? (
        <form className={styles.form} onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <label className={styles.field}>
            <span className={styles.label}>Empleado</span>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <RecetaFilterSelect
                  value={field.value}
                  options={employeeOptions}
                  onChange={field.onChange}
                  theme={modalTheme}
                  size="md"
                  id="medical-leave-employee"
                  placeholder={employeePlaceholder}
                  disabled={busy || employeesQuery.isLoading || employeeOptions.length === 0}
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
              />
              {errors.endDate ? (
                <span className={styles.error}>{errors.endDate.message}</span>
              ) : null}
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Soporte médico (opcional al registrar)</span>
            <MedicalLeaveSupportFileUpload
              resetKey={uploadResetKey}
              disabled={busy}
              error={fileError}
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

          {!createdLeave.supportStorageObjectId ? (
            <div className={styles.uploadBlock}>
              <span className={styles.label}>Adjuntar soporte médico</span>
              <MedicalLeaveSupportFileUpload
                resetKey={uploadResetKey}
                disabled={uploadSupportMutation.isPending}
                error={fileError}
                onErrorChange={setFileError}
                onChange={setSelectedFile}
                description="Requerido antes de radicar ante EPS/ARL"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!selectedFile || uploadSupportMutation.isPending}
                onClick={() => void handleUploadSupport()}
              >
                {uploadSupportMutation.isPending ? 'Subiendo…' : 'Subir soporte'}
              </Button>
            </div>
          ) : (
            <p className={styles.successNote}>Soporte médico adjuntado correctamente.</p>
          )}

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
