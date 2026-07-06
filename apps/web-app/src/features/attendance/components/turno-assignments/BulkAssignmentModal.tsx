import {
  CargoModal,
  Checkbox,
  FileUpload,
  InventarioDateField,
  InventarioFormField,
  RecetaFormButton,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { TurnoAssignmentsApiError } from '../../api/turno-assignments.api';
import { downloadBlob } from '../../api/turnos.api';
import {
  useDownloadAssignmentTemplateMutation,
  useImportAssignmentsMutation,
} from '../../hooks/useTurnoAssignmentMutations';
import type { BulkImportResult } from '../../types/turno-assignments.types';
import {
  daysBetween,
  expandDatesInRange,
  parseDateOnly,
  todayDateOnly,
} from '../../utils/week.utils';
import styles from './BulkAssignmentModal.module.scss';

const WEEKDAY_OPTIONS = [
  { iso: 1, label: 'Lun' },
  { iso: 2, label: 'Mar' },
  { iso: 3, label: 'Mié' },
  { iso: 4, label: 'Jue' },
  { iso: 5, label: 'Vie' },
  { iso: 6, label: 'Sáb' },
  { iso: 7, label: 'Dom' },
] as const;

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const MAX_RANGE_DAYS = 90;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

function isBulkImportResult(value: unknown): value is BulkImportResult {
  return Boolean(value) && typeof value === 'object' && 'errors' in (value as object);
}

interface BulkAssignmentModalProps {
  open: boolean;
  selectedEmployeeIds: string[];
  canOverridePastDate: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
}

export function BulkAssignmentModal({
  open,
  selectedEmployeeIds,
  canOverridePastDate,
  theme = 'dark',
  onClose,
}: BulkAssignmentModalProps): React.JSX.Element | null {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  const downloadTemplate = useDownloadAssignmentTemplateMutation();
  const importMutation = useImportAssignmentsMutation();

  useEffect(() => {
    if (open) {
      setFile(null);
      setFileError(null);
      setImportResult(null);
    }
  }, [open]);

  const toggleWeekday = (iso: number): void => {
    setSelectedWeekdays((current) =>
      current.includes(iso) ? current.filter((day) => day !== iso) : [...current, iso].sort(),
    );
  };

  const dateValidationError = useMemo((): string | null => {
    if (!fechaDesde || !fechaHasta) {
      return null;
    }
    const from = parseDateOnly(fechaDesde);
    const to = parseDateOnly(fechaHasta);
    if (to.getTime() < from.getTime()) {
      return 'La fecha "hasta" debe ser mayor o igual a "desde"';
    }
    if (daysBetween(from, to) > MAX_RANGE_DAYS) {
      return `El rango de fechas no puede superar ${MAX_RANGE_DAYS} días`;
    }
    if (selectedWeekdays.length === 0) {
      return 'Selecciona al menos un día de la semana';
    }
    if (!canOverridePastDate && fechaDesde < todayDateOnly()) {
      return 'La fecha "desde" no puede ser anterior a hoy';
    }
    return null;
  }, [fechaDesde, fechaHasta, selectedWeekdays, canOverridePastDate]);

  const affectedDatesCount = useMemo((): number => {
    if (!fechaDesde || !fechaHasta || dateValidationError) {
      return 0;
    }
    return expandDatesInRange(
      parseDateOnly(fechaDesde),
      parseDateOnly(fechaHasta),
      selectedWeekdays,
    ).length;
  }, [fechaDesde, fechaHasta, selectedWeekdays, dateValidationError]);

  const canDownload = Boolean(
    fechaDesde && fechaHasta && !dateValidationError && selectedEmployeeIds.length > 0,
  );

  const handleDownload = async (): Promise<void> => {
    try {
      const blob = await downloadTemplate.mutateAsync({
        from: fechaDesde,
        to: fechaHasta,
        weekdays: selectedWeekdays.join(','),
        employeeIds: selectedEmployeeIds.join(','),
      });
      if (!blob) {
        toast.info('No hay datos para generar la plantilla con estos filtros');
        return;
      }
      downloadBlob(blob, `plantilla_turnos_${fechaDesde}_${fechaHasta}.xlsx`);
      toast.success('Plantilla descargada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo descargar la plantilla');
    }
  };

  const handleFileSelect = (files: File[]): void => {
    const selected = files[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const extension = selected.name.slice(selected.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError('El archivo debe tener extensión .xlsx o .xls');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError('El archivo no puede superar 5 MB');
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(selected);
    setImportResult(null);
  };

  const handleImport = async (): Promise<void> => {
    if (!file) {
      return;
    }
    try {
      const result = await importMutation.mutateAsync(file);
      setImportResult(result);
      toast.success('Importación completada');
    } catch (error) {
      if (error instanceof TurnoAssignmentsApiError && isBulkImportResult(error.body)) {
        setImportResult(error.body);
      }
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el archivo');
    }
  };

  if (!open) {
    return null;
  }

  return (
    <CargoModal
      open
      title="Asignación masiva de Turnos"
      subtitle="Genera la plantilla o importa un archivo con las asignaciones"
      theme={theme}
      size="md"
      onClose={onClose}
    >
      <div className={styles.body}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>1. Asignación masiva de Turnos</h3>
          <p className={styles.sectionSubtitle}>
            Configura el rango de fechas y descarga la plantilla para los colaboradores
            seleccionados en la grilla.
          </p>

          <div className={styles.dateRow}>
            <InventarioFormField label="Desde" theme={theme} size="md">
              <InventarioDateField value={fechaDesde} onChange={setFechaDesde} theme={theme} />
            </InventarioFormField>
            <InventarioFormField label="Hasta" theme={theme} size="md">
              <InventarioDateField value={fechaHasta} onChange={setFechaHasta} theme={theme} />
            </InventarioFormField>
          </div>

          <div className={styles.weekdaysRow}>
            {WEEKDAY_OPTIONS.map((option) => (
              <Checkbox
                key={option.iso}
                theme={theme}
                size="sm"
                label={option.label}
                checked={selectedWeekdays.includes(option.iso)}
                onChange={() => toggleWeekday(option.iso)}
              />
            ))}
          </div>

          {dateValidationError ? <p className={styles.error}>{dateValidationError}</p> : null}

          <div className={styles.summary}>
            <span>Colaboradores seleccionados: {selectedEmployeeIds.length}</span>
            <span>Fechas afectadas: {affectedDatesCount}</span>
            {fechaDesde && fechaHasta ? (
              <span>
                Rango: {fechaDesde} — {fechaHasta}
              </span>
            ) : null}
            <span>
              Días:{' '}
              {WEEKDAY_OPTIONS.filter((option) => selectedWeekdays.includes(option.iso))
                .map((option) => option.label)
                .join(', ') || '—'}
            </span>
          </div>

          <RecetaFormButton
            variant="save"
            label={downloadTemplate.isPending ? 'Generando...' : 'Descargar plantilla'}
            type="button"
            theme={theme}
            onClick={() => void handleDownload()}
            disabled={!canDownload || downloadTemplate.isPending}
          />
        </section>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>2. Importar turnos masivos</h3>
          <p className={styles.sectionSubtitle}>Selecciona tu archivo de turnos</p>

          {/* accept/maxSize no se pasan: FileUpload descarta esos archivos en silencio, sin exponer el motivo. */}
          <FileUpload
            theme={theme}
            onFileSelect={handleFileSelect}
            label="Click para subir o arrastra tu archivo"
            description="Excel .xlsx o .xls (máx. 5MB)"
          />
          {fileError ? <p className={styles.error}>{fileError}</p> : null}

          <RecetaFormButton
            variant="save"
            label={importMutation.isPending ? 'Importando...' : 'Importar'}
            type="button"
            theme={theme}
            onClick={() => void handleImport()}
            disabled={!file || Boolean(fileError) || importMutation.isPending}
          />

          {importResult ? (
            <div className={styles.resultPanel}>
              <div className={styles.resultStats}>
                <span>Asignadas/actualizadas: {importResult.createdOrUpdated}</span>
                <span>Devueltas a base: {importResult.returnedToBase}</span>
                <span>Descansos: {importResult.restDays}</span>
                <span>Excluidos: {importResult.excluded}</span>
                <span>Errores: {importResult.errorCount}</span>
              </div>
              {importResult.errors.length > 0 ? (
                <ul className={styles.errorList}>
                  {importResult.errors.map((rowError, index) => (
                    <li key={`${rowError.row}-${index}`}>
                      Fila {rowError.row}
                      {rowError.employee ? ` (${rowError.employee})` : ''}
                      {rowError.date ? ` — ${rowError.date}` : ''}: {rowError.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </CargoModal>
  );
}
