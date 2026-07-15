import {
  Button,
  Combobox,
  DatePicker,
  Modal,
  RecetaFilterSelect,
  RecetaTextInput,
  toast,
} from '@restopsiq/ui';
import { format, isValid, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { usePayrollNovedadMutations } from '../hooks/usePayrollNovedadMutations';
import { useNovedadTypeConfigQuery } from '../hooks/useNovedadTypeConfigQuery';
import { useActivePayrollEmployeesQuery } from '../hooks/useActivePayrollEmployeesQuery';
import { uploadPayrollNovedadSupportDraft } from '../api/payroll-novedades.client';
import type { ListPayrollNovedadesFilters, NovedadType } from '../types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '../types/payroll-novedades.types';
import { calculateLutoEndDateFromIso } from '../utils/luto-end-date.util';
import { PayrollNovedadSupportFileUpload } from './PayrollNovedadSupportFileUpload';
import styles from './PayrollNovedadFormModal.module.scss';

const TYPE_OPTIONS = Object.entries(NOVEDAD_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseIsoDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

function filterEmployeeOptions(
  options: { value: string; label: string }[],
  query: string,
): { value: string; label: string }[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

interface Props {
  open: boolean;
  listFilters: ListPayrollNovedadesFilters;
  onClose: () => void;
}

export function PayrollNovedadFormModal({
  open,
  listFilters,
  onClose,
}: Props): React.JSX.Element | null {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();

  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<NovedadType>('PERMISO_REMUNERADO');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [supportFileError, setSupportFileError] = useState<string | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  const employeesQuery = useActivePayrollEmployeesQuery();
  const typeConfigQuery = useNovedadTypeConfigQuery(open);
  const { submitMutation } = usePayrollNovedadMutations(listFilters);

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
    setEmployeeId('');
    setType('PERMISO_REMUNERADO');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setEmployeeSearch('');
    setSupportFile(null);
    setSupportFileError(null);
    setUploadResetKey((current) => current + 1);
  }, [open]);

  useEffect(() => {
    if (requiresSupportDocument) return;
    setSupportFile(null);
    setSupportFileError(null);
    setUploadResetKey((current) => current + 1);
  }, [requiresSupportDocument]);

  const busy = submitMutation.isPending;

  const handleSubmit = async () => {
    if (!employeeId || !startDate || (!isLuto && !endDate)) {
      toast.error('Complete empleado y fechas');
      return;
    }

    if (requiresSupportDocument && !supportFile) {
      setSupportFileError('Adjunte el soporte requerido para este tipo');
      toast.error('Adjunte el soporte requerido para este tipo');
      return;
    }

    try {
      let supportStorageObjectId: string | undefined;
      if (requiresSupportDocument && supportFile) {
        const uploaded = await uploadPayrollNovedadSupportDraft(employeeId, supportFile);
        supportStorageObjectId = uploaded.id;
      }

      const result = await submitMutation.mutateAsync({
        employeeId,
        type,
        startDate,
        endDate: isLuto ? (calculatedLutoEndDate ?? startDate) : endDate,
        notes: notes || undefined,
        supportStorageObjectId,
        requestedBy: 'RRHH',
        autoApprove: false,
      });

      if (result.warnings?.includes('NO_SUPERVISOR_ASSIGNED')) {
        toast.success('Registrada sin supervisor — enviada a RRHH');
      } else {
        toast.success('Novedad registrada');
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar');
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
      title="Nueva novedad"
      description="Registrar ausencia, permiso o licencia en nombre del empleado."
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
            disabled={busy}
          >
            {busy ? 'Registrando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <span className={styles.label}>Empleado</span>
          <Combobox
            value={employeeId}
            options={employeeSelectOptions}
            onChange={(value) => setEmployeeId(typeof value === 'string' ? value : '')}
            onSearch={setEmployeeSearch}
            placeholder="Seleccionar"
            theme={modalTheme}
            size="md"
            className={styles.control}
            loading={employeesQuery.isLoading}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Tipo</span>
          <RecetaFilterSelect
            value={type}
            options={TYPE_OPTIONS}
            onChange={(value) => setType(value as NovedadType)}
            theme={modalTheme}
            size="md"
            className={styles.control}
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
