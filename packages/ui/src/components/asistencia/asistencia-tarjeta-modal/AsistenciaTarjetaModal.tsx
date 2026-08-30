import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaModal.module.scss';

export interface AsistenciaTarjetaModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  theme?: AsistenciaTheme;
}

export function AsistenciaTarjetaModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  theme = 'dark',
}: AsistenciaTarjetaModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={[styles.modal, styles[`theme--${theme}`]].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asistencia-tarjeta-modal-title"
      >
        <h2 id="asistencia-tarjeta-modal-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.primary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AsistenciaTarjetaModalField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function AsistenciaTarjetaModalInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): JSX.Element {
  return <input {...props} className={[styles.input, props.className].filter(Boolean).join(' ')} />;
}

export function AsistenciaTarjetaModalSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
): JSX.Element {
  return (
    <select {...props} className={[styles.select, props.className].filter(Boolean).join(' ')} />
  );
}

export function AsistenciaTarjetaModalTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
): JSX.Element {
  return (
    <textarea {...props} className={[styles.textarea, props.className].filter(Boolean).join(' ')} />
  );
}

export default AsistenciaTarjetaModal;
