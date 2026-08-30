import {
  AsistenciaPage,
  AsistenciaTarjeta,
  AsistenciaTarjetaMarkingModal,
  AsistenciaTarjetaModal,
  AsistenciaTarjetaModalField,
  AsistenciaTarjetaModalTextarea,
  toast,
  type AsistenciaTarjetaDayRow,
  type AsistenciaTarjetaExistingMark,
  type AsistenciaTarjetaMarkDraft,
  type AsistenciaTarjetaMarkType,
  type AsistenciaTarjetaRowAction,
  type AsistenciaTarjetaSortDirection,
  type AsistenciaTarjetaSortKey,
} from '@restopsiq/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useMe } from '@/features/auth/hooks/useMe';
import { useTheme } from '@/providers/ThemeProvider';

import { ATTENDANCE_ROUTES } from '../constants/routes';
import { useAttendanceCardData } from '../hooks/useAttendanceCardData';
import {
  useCreateManualMarkingMutation,
  useDeleteManualMarkingMutation,
  useUpsertObservationMutation,
} from '../hooks/useAttendanceMutations';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import {
  mapPayrollEmployeeToCardHeader,
  sortAttendanceCardRows,
} from '../mappers/attendance-card.mapper';
import { formatTimeLabel } from '../utils/attendance-card-calculations';
import {
  ATTENDANCE_CARD_PAGE_SIZE,
  formatDisplayDate,
  getCurrentMonthRange,
  toIsoDate,
  validateAttendanceDateRange,
} from '../utils/attendance-card-dates';
import { createMarkDraft, nextMarkType } from '../utils/attendance-card-drafts';

import styles from './AttendanceCardScreen.module.scss';

const SUPER_ROLES = new Set(['OWNER', 'SUPER_ADMIN', 'ADMIN']);
const MARKING_ROLES = new Set(['OWNER', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGER']);

interface LocationState {
  employeeId?: string;
}

export function AttendanceCardScreen(): React.JSX.Element {
  const { locationId = '', userId = '' } = useParams();
  const navigate = useNavigate();
  const routeState = useLocation().state as LocationState | null;
  const { theme } = useTheme();
  const asistenciaTheme = theme === 'light' ? 'light' : 'dark';
  const meQuery = useMe();

  const monthRange = getCurrentMonthRange();
  const [draftFrom, setDraftFrom] = useState(monthRange.from);
  const [draftTo, setDraftTo] = useState(monthRange.to);
  const [appliedFrom, setAppliedFrom] = useState(toIsoDate(monthRange.from));
  const [appliedTo, setAppliedTo] = useState(toIsoDate(monthRange.to));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<AsistenciaTarjetaSortKey>('dateLabel');
  const [sortDirection, setSortDirection] = useState<AsistenciaTarjetaSortDirection>('asc');
  const [page, setPage] = useState(1);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [observationRow, setObservationRow] = useState<AsistenciaTarjetaDayRow | null>(null);
  const [observationText, setObservationText] = useState('');
  const [markingRow, setMarkingRow] = useState<AsistenciaTarjetaDayRow | null>(null);
  const [markDrafts, setMarkDrafts] = useState<AsistenciaTarjetaMarkDraft[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employee = employeeQuery.data;
  const employeeId = routeState?.employeeId ?? employee?.id ?? '';

  const roleCode = meQuery.data?.roleCode?.toUpperCase() ?? '';
  const canAccessAnyLocation = SUPER_ROLES.has(roleCode);
  const canEditMarking = MARKING_ROLES.has(roleCode);
  const hasLocationAccess = canAccessAnyLocation || !employee || employee.locationId === locationId;

  const { cardQuery, rows, summary } = useAttendanceCardData({
    userId,
    fromIso: appliedFrom,
    toIso: appliedTo,
    enabled: Boolean(userId && employeeId && locationId && hasLocationAccess),
  });

  const upsertObservationMutation = useUpsertObservationMutation();
  const createManualMarkingMutation = useCreateManualMarkingMutation();
  const deleteManualMarkingMutation = useDeleteManualMarkingMutation();

  const sortedRows = useMemo(
    () => sortAttendanceCardRows(rows, sortKey, sortDirection),
    [rows, sortKey, sortDirection],
  );

  const totalDays = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalDays / ATTENDANCE_CARD_PAGE_SIZE));
  const paginatedRows =
    totalDays > ATTENDANCE_CARD_PAGE_SIZE
      ? sortedRows.slice((page - 1) * ATTENDANCE_CARD_PAGE_SIZE, page * ATTENDANCE_CARD_PAGE_SIZE)
      : sortedRows;

  const header = mapPayrollEmployeeToCardHeader(employee);

  const existingObservation = useMemo(
    () =>
      observationRow
        ? cardQuery.data?.observations.find(
            (observation) => observation.workDate.slice(0, 10) === observationRow.id,
          )
        : undefined,
    [cardQuery.data, observationRow],
  );

  const existingMarksForDay = useMemo((): AsistenciaTarjetaExistingMark[] => {
    if (!markingRow) return [];
    return (cardQuery.data?.logs ?? [])
      .filter((log) => log.workDate.slice(0, 10) === markingRow.id)
      .map((log) => ({
        id: log.id,
        type: log.eventType,
        timeLabel: formatTimeLabel(log.timestamp),
        source:
          log.source === 'MANUAL' ? 'MANUAL' : log.source === 'APP_MOVIL' ? 'APP_MOVIL' : 'DEVICE',
        reason: log.manualReason,
        createdByEmail: log.createdBy?.email,
        createdAtLabel: log.createdAt
          ? `registrada el ${formatDisplayDate(log.createdAt.slice(0, 10))} ${formatTimeLabel(log.createdAt)}`
          : undefined,
      }));
  }, [cardQuery.data, markingRow]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuRowId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const error = validateAttendanceDateRange(draftFrom, draftTo);
    if (error) {
      setRangeError(error);
      return;
    }
    setRangeError(null);
    setAppliedFrom(toIsoDate(draftFrom));
    setAppliedTo(toIsoDate(draftTo));
    setPage(1);
  };

  const toggleSort = (key: AsistenciaTarjetaSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const handleRowAction = (row: AsistenciaTarjetaDayRow, action: AsistenciaTarjetaRowAction) => {
    if (action === 'observation') {
      setOpenMenuRowId(null);
      setObservationRow(row);
      const existing = cardQuery.data?.observations.find(
        (observation) => observation.workDate.slice(0, 10) === row.id,
      );
      setObservationText(existing?.note ?? '');
      return;
    }

    if (!canEditMarking) {
      toast.error('No tienes permisos para editar marcaciones.');
      return;
    }

    setOpenMenuRowId(null);
    setMarkingRow(row);
    setMarkDrafts([createMarkDraft(row.id, 'ENTRY')]);
    setChangeReason('');
  };

  const saveObservationModal = async () => {
    if (!observationRow) return;
    if (observationText.length > 500) {
      toast.error('La observación acepta hasta 500 caracteres.');
      return;
    }
    try {
      await upsertObservationMutation.mutateAsync({
        userId,
        input: { workDate: observationRow.id, note: observationText.trim() },
      });
      setObservationRow(null);
      toast.success('Observación guardada');
    } catch {
      toast.error('No se pudo guardar la observación.');
    }
  };

  const closeMarkingModal = () => {
    setMarkingRow(null);
    setMarkDrafts([]);
    setChangeReason('');
  };

  const resetMarkingModal = () => {
    if (!markingRow) return;
    setMarkDrafts([createMarkDraft(markingRow.id, 'ENTRY')]);
    setChangeReason('');
  };

  const saveMarkingModal = async () => {
    if (!markingRow) return;

    if (!changeReason.trim()) {
      toast.error('Seleccione un motivo de cambio.');
      return;
    }

    try {
      for (const draft of markDrafts) {
        await createManualMarkingMutation.mutateAsync({
          userId,
          input: {
            workDate: markingRow.id,
            eventType: draft.type,
            timestamp: new Date(draft.datetimeLocal).toISOString(),
            reason: changeReason.trim(),
          },
        });
      }
      closeMarkingModal();
      toast.success('Marcación guardada');
    } catch {
      toast.error('No se pudo guardar la marcación.');
    }
  };

  const handleDeleteExistingMark = async (markId: string) => {
    if (!canEditMarking) {
      toast.error('No tienes permisos para eliminar marcaciones.');
      return;
    }
    if (!window.confirm('¿Eliminar esta marcación manual? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await deleteManualMarkingMutation.mutateAsync(markId);
      toast.success('Marcación eliminada');
    } catch {
      toast.error('No se pudo eliminar la marcación.');
    }
  };

  const addMarkDraft = () => {
    if (!markingRow) return;
    setMarkDrafts((current) => [...current, createMarkDraft(markingRow.id, nextMarkType(current))]);
  };

  const removeMarkDraft = (markId: string) => {
    setMarkDrafts((current) => current.filter((mark) => mark.id !== markId));
  };

  const updateMarkDraftType = (markId: string, type: AsistenciaTarjetaMarkType) => {
    setMarkDrafts((current) =>
      current.map((mark) => (mark.id === markId ? { ...mark, type } : mark)),
    );
  };

  const updateMarkDraftDatetime = (markId: string, datetimeLocal: string) => {
    setMarkDrafts((current) =>
      current.map((mark) => (mark.id === markId ? { ...mark, datetimeLocal } : mark)),
    );
  };

  const handleExport = (format: 'excel' | 'pdf' | 'email') => {
    const labels = { excel: 'Excel', pdf: 'PDF', email: 'correo' };
    toast.info(`Exportación a ${labels[format]} estará disponible próximamente.`);
  };

  if (!hasLocationAccess) {
    return (
      <AsistenciaPage theme={asistenciaTheme}>
        <div className={styles.denied}>
          <p role="alert">
            No tienes permisos para ver la tarjeta de este colaborador en esta sede.
          </p>
          <button
            type="button"
            onClick={() => navigate(ATTENDANCE_ROUTES.locationDetail(locationId))}
          >
            ← Volver al listado
          </button>
        </div>
      </AsistenciaPage>
    );
  }

  return (
    <AsistenciaTarjeta
      theme={asistenciaTheme}
      header={header}
      summaryMetrics={summary}
      rows={paginatedRows}
      sortKey={sortKey}
      sortDirection={sortDirection}
      openMenuRowId={openMenuRowId}
      rangeError={rangeError ?? undefined}
      loading={employeeQuery.isLoading || cardQuery.isLoading}
      errorMessage={
        employeeQuery.isError || cardQuery.isError
          ? 'No se pudo cargar la tarjeta de asistencia.'
          : undefined
      }
      fromDate={draftFrom}
      toDate={draftTo}
      onFromDateChange={(date) => date && setDraftFrom(date)}
      onToDateChange={(date) => date && setDraftTo(date)}
      pagination={
        totalDays > ATTENDANCE_CARD_PAGE_SIZE ? (
          <footer className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Anterior
            </button>
            <span className={styles.pageSummary}>
              Página {page} de {totalPages} · {formatDisplayDate(appliedFrom)} –{' '}
              {formatDisplayDate(appliedTo)}
            </span>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Siguiente
            </button>
          </footer>
        ) : undefined
      }
      onBack={() => navigate(ATTENDANCE_ROUTES.locationDetail(locationId))}
      onSearch={handleSearch}
      onExport={handleExport}
      onSort={toggleSort}
      onToggleMenu={(rowId) => setOpenMenuRowId((current) => (current === rowId ? null : rowId))}
      onRowAction={handleRowAction}
      menuRef={menuRef}
      modals={
        <>
          <AsistenciaTarjetaModal
            open={Boolean(observationRow)}
            title={`Observación — ${observationRow?.dateLabel ?? ''}`}
            theme={asistenciaTheme}
            onClose={() => setObservationRow(null)}
            onConfirm={saveObservationModal}
          >
            {existingObservation ? (
              <p className={styles.observationMeta}>
                Última edición por {existingObservation.updatedBy?.email ?? 'N/A'} el{' '}
                {formatDisplayDate(existingObservation.updatedAt.slice(0, 10))}{' '}
                {formatTimeLabel(existingObservation.updatedAt)}
              </p>
            ) : null}
            <AsistenciaTarjetaModalField label="Nota (máx. 500 caracteres)" htmlFor="obs-text">
              <AsistenciaTarjetaModalTextarea
                id="obs-text"
                value={observationText}
                maxLength={500}
                onChange={(event) => setObservationText(event.target.value)}
              />
            </AsistenciaTarjetaModalField>
          </AsistenciaTarjetaModal>

          <AsistenciaTarjetaMarkingModal
            open={Boolean(markingRow)}
            dateLabel={markingRow?.dateLabel ?? ''}
            marks={markDrafts}
            changeReason={changeReason}
            existingMarks={existingMarksForDay}
            theme={asistenciaTheme}
            onClose={closeMarkingModal}
            onReset={resetMarkingModal}
            onSave={saveMarkingModal}
            onAddMark={addMarkDraft}
            onRemoveMark={removeMarkDraft}
            onMarkTypeChange={updateMarkDraftType}
            onMarkDatetimeChange={updateMarkDraftDatetime}
            onChangeReasonChange={setChangeReason}
            onDeleteExistingMark={handleDeleteExistingMark}
          />
        </>
      }
    />
  );
}

export default AttendanceCardScreen;
