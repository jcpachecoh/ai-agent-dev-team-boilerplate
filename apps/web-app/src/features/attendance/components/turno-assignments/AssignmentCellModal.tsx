import { CargoModal, RecetaFilterSelect, RecetaFormButton } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import type { Turno } from '../../types/turnos.types';
import { formatDayMonth, weekdayLabel } from '../../utils/week.utils';
import styles from './AssignmentCellModal.module.scss';

export interface AssignmentCellModalTarget {
  employeeId: string;
  colaboradorNombre: string;
  fecha: string;
  weekdayIndex: number;
  currentTurnoId?: string;
  currentType: 'ASSIGNED' | 'REST' | 'BASE';
  hasExplicitAssignment: boolean;
}

interface AssignmentCellModalProps {
  target: AssignmentCellModalTarget | null;
  turnosActivos: Turno[];
  submitting?: boolean;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onAssign: (turnoId: string) => void;
  onMarkRest: () => void;
  onRemove: () => void;
}

export function AssignmentCellModal({
  target,
  turnosActivos,
  submitting = false,
  readOnly = false,
  theme = 'dark',
  onClose,
  onAssign,
  onMarkRest,
  onRemove,
}: AssignmentCellModalProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'ASSIGNED' | 'REST'>('ASSIGNED');
  const [turnoId, setTurnoId] = useState<string>('');

  useEffect(() => {
    if (!target) return;
    setMode(target.currentType === 'REST' ? 'REST' : 'ASSIGNED');
    setTurnoId(target.currentTurnoId ?? turnosActivos[0]?.id ?? '');
  }, [target, turnosActivos]);

  if (!target) {
    return null;
  }

  const handleConfirm = (): void => {
    if (mode === 'REST') {
      onMarkRest();
      return;
    }
    if (turnoId) {
      onAssign(turnoId);
    }
  };

  return (
    <CargoModal
      open
      title="Asignar turno"
      subtitle={`${target.colaboradorNombre} · ${weekdayLabel(target.weekdayIndex)} ${formatDayMonth(target.fecha)}`}
      theme={theme}
      size="sm"
      onClose={onClose}
    >
      <div className={styles.body}>
        {readOnly ? (
          <p className={styles.readOnlyNotice} role="status">
            No tienes permisos para modificar asignaciones en fechas pasadas.
          </p>
        ) : (
          <>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={mode === 'ASSIGNED' ? styles.modeActive : styles.modeButton}
                onClick={() => setMode('ASSIGNED')}
                disabled={submitting}
              >
                Asignar turno
              </button>
              <button
                type="button"
                className={mode === 'REST' ? styles.modeActive : styles.modeButton}
                onClick={() => setMode('REST')}
                disabled={submitting}
              >
                Marcar descanso
              </button>
            </div>

            {mode === 'ASSIGNED' ? (
              <RecetaFilterSelect
                theme={theme}
                size="md"
                className={styles.select}
                value={turnoId}
                options={turnosActivos.map((turno) => ({
                  value: turno.id,
                  label: `${turno.nombre} (${turno.sigla}) · ${turno.horaInicio}-${turno.horaFin}`,
                }))}
                onChange={setTurnoId}
                disabled={submitting}
              />
            ) : (
              <p className={styles.restNotice}>
                El colaborador quedará marcado como descanso explícito para este día.
              </p>
            )}
          </>
        )}

        <div className={styles.actions}>
          {target.hasExplicitAssignment && !readOnly ? (
            <RecetaFormButton
              variant="cancel"
              label={submitting ? 'Quitando...' : 'Quitar asignación'}
              type="button"
              theme={theme}
              onClick={onRemove}
              disabled={submitting}
            />
          ) : (
            <span />
          )}
          <div className={styles.actionsRight}>
            <RecetaFormButton
              variant="cancel"
              label="Cancelar"
              type="button"
              theme={theme}
              onClick={onClose}
              disabled={submitting}
            />
            {!readOnly ? (
              <RecetaFormButton
                variant="save"
                label={submitting ? 'Guardando...' : 'Confirmar'}
                type="button"
                theme={theme}
                onClick={handleConfirm}
                disabled={submitting || (mode === 'ASSIGNED' && !turnoId)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </CargoModal>
  );
}
