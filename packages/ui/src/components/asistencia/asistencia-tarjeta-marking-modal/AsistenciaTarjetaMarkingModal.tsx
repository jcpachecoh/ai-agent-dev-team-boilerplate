import { Info, Lock, Trash2, X } from 'lucide-react';
import type { JSX } from 'react';

import type {
  AsistenciaTarjetaMarkDraft,
  AsistenciaTarjetaMarkReasonOption,
  AsistenciaTarjetaMarkType,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import { ASISTENCIA_TARJETA_MARK_REASONS } from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaMarkingModal.module.scss';

export interface AsistenciaTarjetaExistingMark {
  id: string;
  type: AsistenciaTarjetaMarkType;
  timeLabel: string;
  source: 'APP_MOVIL' | 'MANUAL' | 'DEVICE';
  reason?: string | null;
  createdByEmail?: string | null;
  createdAtLabel?: string | null;
}

export function attendanceSourceLabel(source: AsistenciaTarjetaExistingMark['source']): string {
  switch (source) {
    case 'MANUAL':
      return 'Manual';
    case 'APP_MOVIL':
      return 'App móvil';
    default:
      return 'Automática';
  }
}

export interface AsistenciaTarjetaMarkingModalProps {
  open: boolean;
  dateLabel: string;
  marks: AsistenciaTarjetaMarkDraft[];
  changeReason: string;
  reasonOptions?: AsistenciaTarjetaMarkReasonOption[];
  existingMarks?: AsistenciaTarjetaExistingMark[];
  theme?: AsistenciaTheme;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
  onAddMark: () => void;
  onRemoveMark: (markId: string) => void;
  onMarkTypeChange: (markId: string, type: AsistenciaTarjetaMarkType) => void;
  onMarkDatetimeChange: (markId: string, datetimeLocal: string) => void;
  onChangeReasonChange: (value: string) => void;
  onDeleteExistingMark?: (markId: string) => void;
}

export function AsistenciaTarjetaMarkingModal({
  open,
  dateLabel,
  marks,
  changeReason,
  reasonOptions = ASISTENCIA_TARJETA_MARK_REASONS,
  existingMarks = [],
  theme = 'dark',
  onClose,
  onReset,
  onSave,
  onAddMark,
  onRemoveMark,
  onMarkTypeChange,
  onMarkDatetimeChange,
  onChangeReasonChange,
  onDeleteExistingMark,
}: AsistenciaTarjetaMarkingModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={[styles.dialog, styles[`theme--${theme}`]].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asistencia-marking-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="asistencia-marking-modal-title" className={styles.title}>
            Crear/Editar Marcas del {dateLabel}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X aria-hidden />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.alert} role="note">
            <Info className={styles.alertIcon} aria-hidden />
            <div className={styles.alertText}>
              <p className={styles.alertPrimary}>
                ¡Solo se pueden modificar o eliminar marcas manuales.
              </p>
              <p className={styles.alertSecondary}>
                Las marcas reales solo se pueden modificar o eliminar si el Flujo de Aprobación de
                Marcas está habilitado en el lugar de trabajo.
              </p>
            </div>
          </div>

          {existingMarks.length > 0 ? (
            <div className={styles.existingMarks} role="note">
              <p className={styles.existingMarksTitle}>Marcaciones registradas este día</p>
              <ul className={styles.existingMarksList}>
                {existingMarks.map((mark) => (
                  <li key={mark.id} className={styles.existingMarksItem}>
                    <div className={styles.existingMarksInfo}>
                      <span className={styles.existingMarksType}>
                        {mark.type === 'ENTRY' ? 'Entrada' : 'Salida'} · {mark.timeLabel} ·{' '}
                        {attendanceSourceLabel(mark.source)}
                      </span>
                      {mark.reason ? (
                        <span className={styles.existingMarksReason}>Motivo: {mark.reason}</span>
                      ) : null}
                      {mark.createdByEmail ? (
                        <span className={styles.existingMarksAuthor}>
                          Registrada por {mark.createdByEmail}
                          {mark.createdAtLabel ? ` · ${mark.createdAtLabel}` : ''}
                        </span>
                      ) : null}
                    </div>
                    {mark.source === 'MANUAL' ? (
                      <button
                        type="button"
                        className={styles.existingMarksDeleteButton}
                        aria-label={`Eliminar marcación manual de ${mark.type === 'ENTRY' ? 'entrada' : 'salida'} · ${mark.timeLabel}`}
                        onClick={() => onDeleteExistingMark?.(mark.id)}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    ) : (
                      <span
                        className={styles.existingMarksLocked}
                        title="Las marcaciones automáticas no se pueden eliminar"
                      >
                        <Lock size={14} aria-hidden />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.markTable}>
            <div className={styles.markHeader}>
              <span>Entrada</span>
              <span>Salida</span>
              <span className={styles.markHeaderAction} aria-hidden />
            </div>

            {marks.length === 0 ? (
              <p className={styles.emptyMarks}>No hay marcas manuales para este día.</p>
            ) : (
              marks.map((mark) => (
                <div key={mark.id} className={styles.markRow}>
                  <div className={styles.markCell}>
                    {mark.type === 'ENTRY' ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={styles.datetimeInput}
                        value={mark.datetimeLocal}
                        onChange={(event) => onMarkDatetimeChange(mark.id, event.target.value)}
                        aria-label="Fecha y hora de entrada"
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.useColumnButton}
                        onClick={() => onMarkTypeChange(mark.id, 'ENTRY')}
                      >
                        Usar columna Entrada
                      </button>
                    )}
                  </div>
                  <div className={styles.markCell}>
                    {mark.type === 'EXIT' ? (
                      <input
                        type="datetime-local"
                        step={1}
                        className={styles.datetimeInput}
                        value={mark.datetimeLocal}
                        onChange={(event) => onMarkDatetimeChange(mark.id, event.target.value)}
                        aria-label="Fecha y hora de salida"
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.useColumnButton}
                        onClick={() => onMarkTypeChange(mark.id, 'EXIT')}
                      >
                        Usar columna Salida
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => onRemoveMark(mark.id)}
                    aria-label="Eliminar marca"
                  >
                    <Trash2 aria-hidden />
                  </button>
                </div>
              ))
            )}
          </div>

          <button type="button" className={styles.addMarkButton} onClick={onAddMark}>
            Añadir marca
          </button>

          <div className={styles.reasonField}>
            <label className={styles.reasonLabel} htmlFor="mark-change-reason">
              Motivo de cambio:
            </label>
            <select
              id="mark-change-reason"
              className={styles.reasonSelect}
              value={changeReason}
              onChange={(event) => onChangeReasonChange(event.target.value)}
            >
              {reasonOptions.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <div className={styles.footerRight}>
            <button type="button" className={styles.resetButton} onClick={onReset}>
              Restablecer
            </button>
            <button type="button" className={styles.saveButton} onClick={onSave}>
              Guardar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AsistenciaTarjetaMarkingModal;
