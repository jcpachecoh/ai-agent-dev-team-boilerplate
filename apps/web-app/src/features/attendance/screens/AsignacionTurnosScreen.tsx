import {
  CargoPage,
  CargoPageHeader,
  CargoPageSection,
  Checkbox,
  EmptyState,
  InventarioSearch,
  RecetaFilterSelect,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { canOverridePastDateAssignments, canWriteTurnoAssignments } from '@/config/rbac.config';
import { useTheme } from '@/providers/ThemeProvider';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { useMe } from '../../auth/hooks/useMe';
import {
  AssignmentCellModal,
  type AssignmentCellModalTarget,
} from '../components/turno-assignments/AssignmentCellModal';
import { TurnosSubNav } from '../components/turnos/TurnosSubNav';
import {
  useAssignTurnoMutation,
  useDeleteAssignmentMutation,
} from '../hooks/useTurnoAssignmentMutations';
import { useTurnosQuery } from '../hooks/useTurnosQuery';
import { useWeeklyAssignmentsFilters } from '../hooks/useWeeklyAssignmentsFilters';
import { useWeeklyAssignmentsQuery } from '../hooks/useWeeklyAssignmentsQuery';
import type { WeeklyAssignmentCell, WeeklyColaborador } from '../types/turno-assignments.types';
import {
  formatDayMonth,
  formatWeekRangeLabel,
  todayDateOnly,
  weekdayLabel,
} from '../utils/week.utils';
import styles from './AsignacionTurnosScreen.module.scss';

const VIEW_OPTIONS = [
  { value: 'semana', label: 'Semanal' },
  { value: 'dos-semanas', label: 'Dos semanas (próximamente)' },
  { value: 'dia', label: 'Día (próximamente)' },
  { value: 'mes', label: 'Mensual (próximamente)' },
] as const;

function cellLabel(cell: WeeklyAssignmentCell): { primary: string; secondary?: string } {
  if (cell.type === 'ASSIGNED' && cell.turno) {
    return {
      primary: cell.turno.sigla,
      secondary: `${cell.turno.horaInicio}-${cell.turno.horaFin}`,
    };
  }
  if (cell.type === 'REST') {
    return { primary: 'Descanso explícito' };
  }
  return { primary: 'Descanso + Turno Base' };
}

export function AsignacionTurnosScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const cargoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteTurnoAssignments(roleCode);
  const canOverridePastDate = canOverridePastDateAssignments(roleCode);
  const today = todayDateOnly();

  const { weekStart, search, setSearch, queryFilters, goToPreviousWeek, goToNextWeek, goToToday } =
    useWeeklyAssignmentsFilters();

  const weeklyQuery = useWeeklyAssignmentsQuery(queryFilters);
  const turnosActivosQuery = useTurnosQuery({ estado: true, limit: 200 });
  const assignTurno = useAssignTurnoMutation();
  const deleteAssignment = useDeleteAssignmentMutation();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<AssignmentCellModalTarget | null>(null);
  const [submittingCell, setSubmittingCell] = useState(false);

  const dates = weeklyQuery.data?.dates ?? [];
  const colaboradores = weeklyQuery.data?.colaboradores ?? [];
  const turnosActivos = turnosActivosQuery.data?.data ?? [];
  const weekRangeLabel = useMemo(() => formatWeekRangeLabel(dates), [dates]);

  const toggleSelected = (employeeId: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const handleCellClick = (
    colaborador: WeeklyColaborador,
    cell: WeeklyAssignmentCell,
    dayIndex: number,
  ): void => {
    if (!canWrite) return;
    setModalTarget({
      employeeId: colaborador.id,
      colaboradorNombre: colaborador.nombre,
      fecha: cell.fecha,
      weekdayIndex: dayIndex,
      currentTurnoId: cell.turno?.id,
      currentType: cell.type,
      hasExplicitAssignment: Boolean(cell.assignmentId),
    });
  };

  const isPastDate = (fecha: string): boolean => fecha < today;
  const modalReadOnly = Boolean(
    modalTarget && isPastDate(modalTarget.fecha) && !canOverridePastDate,
  );

  const closeModal = (): void => setModalTarget(null);

  const handleAssign = async (turnoId: string): Promise<void> => {
    if (!modalTarget) return;
    setSubmittingCell(true);
    try {
      await assignTurno.mutateAsync({
        employeeId: modalTarget.employeeId,
        workDate: modalTarget.fecha,
        turnoId,
      });
      toast.success('Turno asignado correctamente');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo asignar el turno');
    } finally {
      setSubmittingCell(false);
    }
  };

  const handleMarkRest = async (): Promise<void> => {
    if (!modalTarget) return;
    setSubmittingCell(true);
    try {
      await assignTurno.mutateAsync({
        employeeId: modalTarget.employeeId,
        workDate: modalTarget.fecha,
        type: 'REST',
      });
      toast.success('Descanso registrado');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el descanso');
    } finally {
      setSubmittingCell(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!modalTarget?.hasExplicitAssignment) return;
    const assignmentId = colaboradores
      .find((colaborador) => colaborador.id === modalTarget.employeeId)
      ?.turnos.find((turno) => turno.fecha === modalTarget.fecha)?.assignmentId;
    if (!assignmentId) return;

    setSubmittingCell(true);
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      toast.success('Asignación eliminada, el día vuelve a Turno Base');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la asignación');
    } finally {
      setSubmittingCell(false);
    }
  };

  return (
    <CargoPage theme={cargoTheme} className={styles.screen}>
      <CargoPageSection theme={cargoTheme} divider variant="header">
        <TurnosSubNav />
        <CargoPageHeader
          title="Asignación de Turnos"
          subtitle="Vista semanal de colaboradores por día"
          theme={cargoTheme}
        />
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} divider variant="toolbar">
        {!canWrite ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar la asignación de turnos.
          </p>
        ) : null}

        <div className={styles.toolbar}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Vista</span>
            <RecetaFilterSelect
              aria-label="Seleccionar vista"
              theme={cargoTheme}
              size="md"
              value="semana"
              options={VIEW_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              onChange={() => undefined}
              disabled
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Buscar</span>
            <InventarioSearch
              value={search}
              placeholder="Nombre o documento"
              onChange={setSearch}
              theme={cargoTheme}
              size="md"
              ariaLabel="Buscar colaboradores"
            />
          </div>

          <div className={styles.weekNav}>
            <button type="button" className={styles.navButton} onClick={goToPreviousWeek}>
              Anterior
            </button>
            <span className={styles.weekRange}>{weekRangeLabel}</span>
            <button type="button" className={styles.navButton} onClick={goToNextWeek}>
              Siguiente
            </button>
            <button type="button" className={styles.navButtonToday} onClick={goToToday}>
              Hoy
            </button>
          </div>

          <div className={styles.rightActions}>
            <span className={styles.selectedCounter}>Seleccionados ({selectedIds.size})</span>
            <button
              type="button"
              className={styles.downloadButton}
              disabled
              title="Disponible en Asignación masiva de turnos (OS-583)"
            >
              Descargar formato
            </button>
          </div>
        </div>
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} variant="default">
        {weeklyQuery.isLoading ? (
          <p className={styles.loading}>Cargando asignaciones…</p>
        ) : weeklyQuery.isError ? (
          <EmptyState
            variant="error"
            theme={cargoTheme}
            title="No se pudo cargar la asignación de turnos"
            description="Intenta nuevamente en unos segundos."
          />
        ) : colaboradores.length === 0 ? (
          <EmptyState
            variant="search"
            theme={cargoTheme}
            title="No hay colaboradores para mostrar"
            description="Ajusta el buscador o revisa tu asignación de sedes."
          />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.fixedHeaderCell}>Colaborador</th>
                  {dates.map((fecha, index) => (
                    <th
                      key={fecha}
                      className={
                        fecha === today
                          ? `${styles.dayHeaderCell} ${styles.todayHeaderCell}`
                          : styles.dayHeaderCell
                      }
                    >
                      <span className={styles.dayHeaderWeekday}>{weekdayLabel(index)}</span>
                      <span className={styles.dayHeaderDate}>{formatDayMonth(fecha)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colaborador) => (
                  <tr key={colaborador.id}>
                    <td className={styles.fixedBodyCell}>
                      <div className={styles.colaboradorRow}>
                        <Checkbox
                          theme={cargoTheme}
                          size="sm"
                          checked={selectedIds.has(colaborador.id)}
                          onChange={() => toggleSelected(colaborador.id)}
                          label=""
                        />
                        <div className={styles.colaboradorInfo}>
                          <span className={styles.colaboradorNombre}>
                            {colaborador.nombre.toUpperCase()}
                          </span>
                          <span className={styles.colaboradorDocumento}>
                            {colaborador.documento}
                          </span>
                        </div>
                      </div>
                    </td>
                    {colaborador.turnos.map((cell, dayIndex) => {
                      const { primary, secondary } = cellLabel(cell);
                      const classNames = [styles.cell];
                      if (cell.fecha === today) {
                        classNames.push(styles.todayCell);
                      } else if (dayIndex === 5) {
                        classNames.push(styles.saturdayCell);
                      }
                      if (cell.type !== 'ASSIGNED') {
                        classNames.push(styles.restCell);
                      }
                      return (
                        <td
                          key={cell.fecha}
                          className={classNames.join(' ')}
                          onClick={() => handleCellClick(colaborador, cell, dayIndex)}
                          role={canWrite ? 'button' : undefined}
                        >
                          <span className={styles.cellPrimary}>{primary}</span>
                          {secondary ? (
                            <span className={styles.cellSecondary}>{secondary}</span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CargoPageSection>

      <AssignmentCellModal
        target={modalTarget}
        turnosActivos={turnosActivos}
        submitting={submittingCell}
        readOnly={modalReadOnly}
        theme={cargoTheme}
        onClose={closeModal}
        onAssign={(turnoId) => void handleAssign(turnoId)}
        onMarkRest={() => void handleMarkRest()}
        onRemove={() => void handleRemove()}
      />
    </CargoPage>
  );
}
