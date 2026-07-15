import {
  Button,
  DatePicker,
  Modal,
  RecetaFilterSelect,
  RecetaTextInput,
  toast,
} from '@restopsiq/ui';
import { format, isValid, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { PayrollNovedadSupportFileUpload } from '@/features/payroll/components/PayrollNovedadSupportFileUpload';
import type { NovedadType } from '@/features/payroll/types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '@/features/payroll/types/payroll-novedades.types';
import { calculateLutoEndDateFromIso } from '@/features/payroll/utils/luto-end-date.util';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { useEmployeeNovedadTypeConfigQuery } from '../hooks/useEmployeeNovedadTypeConfigQuery';
import { useMyPayrollNovedadMutations } from '../hooks/useMyPayrollNovedadMutations';
import styles from './MyNovedadRequestModal.module.scss';

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseIsoDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

interface Props {
  open: boolean;
  employeeId: string | undefined;
  onClose: () => void;
}

export function MyNovedadRequestModal({
  open,
  employeeId,
  onClose,
}: Props): React.JSX.Element | null {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();

  const [type, setType] = useState<NovedadType>('PERMISO_REMUNERADO');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [supportFileError, setSupportFileError] = useState<string | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  const typeConfigQuery = useEmployeeNovedadTypeConfigQuery(open);
  const { submitMutation } = useMyPayrollNovedadMutations();

  const typeOptions = useMemo(
    () =>
      (typeConfigQuery.data ?? []).map((config) => ({
        value: config.type,
        label: NOVEDAD_TYPE_LABELS[config.type],
      })),
    [typeConfigQuery.data],
  );

  const requiresSupportDocument = useMemo(() => {
    const config = typeConfigQuery.data?.find((item) => item.type === type);
    return config?.requiresSupportDocument ?? false;
  }, [typeConfigQuery.data, type]);

  const isLuto = type === 'LICENCIA_LUTO';
  const calculatedLutoEndDate = useMemo(
    () => (isLuto && startDate ? calculateLutoEndDateFromIso(startDate) : null),
    [isLuto, startDate],
  );

  useEffect(() => {
    if (!open) return;
    setType('PERMISO_REMUNERADO');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setSupportFile(null);
    setSupportFileError(null);
    setUploadResetKey((current) => current + 1);
  }, [open]);

  useEffect(() => {
    if (!typeOptions.length) return;
    if (!typeOptions.some((option) => option.value === type)) {
      setType(typeOptions[0]!.value as NovedadType);
    }
  }, [typeOptions, type]);

  useEffect(() => {
    if (requiresSupportDocument) return;
    setSupportFile(null);
    setSupportFileError(null);
    setUploadResetKey((current) => current + 1);
  }, [requiresSupportDocument]);

  const busy = submitMutation.isPending;

  const handleSubmit = async () => {
    if (!employeeId || !startDate || (!isLuto && !endDate)) {
      toast.error('Complete las fechas de la solicitud');
      return;
    }

    if (requiresSupportDocument && !supportFile) {
      setSupportFileError('Adjunte el soporte requerido para este tipo');
      toast.error('Adjunte el soporte requerido para este tipo');
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        employeeId,
        type,
        startDate,
        endDate: isLuto ? (calculatedLutoEndDate ?? startDate) : endDate,
        notes: notes || undefined,
        supportFile: supportFile ?? undefined,
      });

      if (result.warnings?.includes('NO_SUPERVISOR_ASSIGNED')) {
        toast.success('Solicitud enviada a RRHH (sin supervisor asignado)');
      } else {
        toast.success('Solicitud enviada correctamente');
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
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
      title="Solicitar novedad"
      description="Solicite permisos, licencias o ausencias justificadas para su revisión."
      onInteractOutside={(event) => {
        if (busy) event.preventDefault();
      }}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={() => void handleSubmit()}
            disabled={busy || !employeeId || typeOptions.length === 0}
          >
            {busy ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <span className={styles.label}>Tipo</span>
          <RecetaFilterSelect
            value={type}
            options={typeOptions}
            onChange={(value) => setType(value as NovedadType)}
            theme={modalTheme}
            size="md"
            className={styles.control}
            disabled={typeConfigQuery.isLoading || typeOptions.length === 0}
          />
        </div>

        {requiresSupportDocument ? (
          <div className={styles.field}>
            <span className={styles.label}>Soporte</span>
            <PayrollNovedadSupportFileUpload
              resetKey={uploadResetKey}
              disabled={busy}
              error={supportFileError}
              onErrorChange={setSupportFileError}
              onChange={setSupportFile}
            />
          </div>
        ) : null}

        <div className={styles.dateRow}>
          <div className={styles.field}>
            <span className={styles.label}>Inicio</span>
            <DatePicker
              value={parseIsoDateValue(startDate)}
              onChange={(date) => setStartDate(date ? toIsoDate(date) : '')}
              theme={modalTheme}
              size="md"
              className={styles.control}
            />
          </div>
          {isLuto ? (
            <div className={styles.field}>
              <span className={styles.label}>Fin calculado (5 días hábiles)</span>
              <RecetaTextInput
                theme={uiTheme}
                className={styles.control}
                value={calculatedLutoEndDate ?? '—'}
                readOnly
              />
            </div>
          ) : (
            <div className={styles.field}>
              <span className={styles.label}>Fin</span>
              <DatePicker
                value={parseIsoDateValue(endDate)}
                onChange={(date) => setEndDate(date ? toIsoDate(date) : '')}
                theme={modalTheme}
                size="md"
                className={styles.control}
              />
            </div>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Notas</span>
          <RecetaTextInput
            theme={uiTheme}
            className={styles.control}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>
    </Modal>
  );
}
