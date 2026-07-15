import { Button, DatePicker, Modal, RecetaTextInput, toast } from '@restopsiq/ui';
import { format, isValid, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { useTheme } from '@/providers/ThemeProvider';

import { usePayrollNovedadAuditQuery } from '../hooks/usePayrollNovedadAuditQuery';
import { usePayrollNovedadMutations } from '../hooks/usePayrollNovedadMutations';
import type {
  ListPayrollNovedadesFilters,
  NovedadType,
  PayrollNovedadSummary,
} from '../types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '../types/payroll-novedades.types';
import { calculateLutoEndDateFromIso } from '../utils/luto-end-date.util';
import { PayrollNovedadAuditHistory } from './PayrollNovedadAuditHistory';
import styles from './PayrollNovedadFormModal.module.scss';

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
  novedad: PayrollNovedadSummary | null;
  listFilters: ListPayrollNovedadesFilters;
  onClose: () => void;
}

export function PayrollNovedadEditModal({
  open,
  novedad,
  listFilters,
  onClose,
}: Props): React.JSX.Element | null {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const uiTheme = useUiTheme();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const { editMutation } = usePayrollNovedadMutations(listFilters);
  const auditQuery = usePayrollNovedadAuditQuery(novedad?.id ?? null, open);

  const isLuto = novedad?.type === 'LICENCIA_LUTO';
  const calculatedLutoEndDate = useMemo(
    () => (isLuto && startDate ? calculateLutoEndDateFromIso(startDate) : null),
    [isLuto, startDate],
  );

  useEffect(() => {
    if (!open || !novedad) return;
    setStartDate(novedad.startDate.slice(0, 10));
    setEndDate(novedad.endDate.slice(0, 10));
    setNotes(novedad.notes ?? '');
  }, [open, novedad]);

  const busy = editMutation.isPending;

  const handleSubmit = async () => {
    if (!novedad || !startDate) {
      toast.error('Complete las fechas');
      return;
    }

    if (!isLuto && !endDate) {
      toast.error('Complete las fechas');
      return;
    }

    try {
      await editMutation.mutateAsync({
        id: novedad.id,
        input: {
          startDate,
          endDate: isLuto ? undefined : endDate,
          notes: notes || undefined,
        },
      });
      toast.success('Novedad actualizada');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo editar');
    }
  };

  if (!open || !novedad) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
      size="md"
      theme={modalTheme}
      title="Editar novedad"
      description={`${NOVEDAD_TYPE_LABELS[novedad.type as NovedadType]} — ${novedad.employeeName}`}
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
            disabled={busy || Boolean(novedad.editBlockedReason)}
          >
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {novedad.editBlockedReason ? (
          <p className={styles.helperText}>{novedad.editBlockedReason}</p>
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
              disabled={Boolean(novedad.editBlockedReason)}
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
                disabled={Boolean(novedad.editBlockedReason)}
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
            disabled={Boolean(novedad.editBlockedReason)}
          />
        </div>

        <PayrollNovedadAuditHistory
          entries={auditQuery.data ?? []}
          isLoading={auditQuery.isLoading}
          isError={auditQuery.isError}
        />
      </div>
    </Modal>
  );
}
