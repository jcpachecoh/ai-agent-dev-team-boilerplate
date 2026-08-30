import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, type JSX } from 'react';

import type { AdminRole } from '../types';
import styles from './DeactivateRoleDialog.module.scss';

export interface DeactivateRoleDialogProps {
  open: boolean;
  role: AdminRole | undefined;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateRoleDialog({
  open,
  role,
  confirming = false,
  onClose,
  onConfirm,
}: DeactivateRoleDialogProps): JSX.Element | null {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !role) {
    return null;
  }

  const hasUsers = role.userCount > 0;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <span className={styles.warningIcon} aria-hidden>
            <AlertTriangle size={18} />
          </span>
          <h2 id={titleId} className={styles.title}>
            Desactivar rol
          </h2>
        </header>

        <div className={styles.body}>
          <p className={styles.message}>
            El rol <span className={styles.code}>{role.code}</span> ({role.name}) será desactivado.
          </p>
          {hasUsers ? (
            <p className={styles.warning}>
              <strong>Advertencia:</strong> Este rol tiene {role.userCount} usuario
              {role.userCount !== 1 ? 's' : ''} activo{role.userCount !== 1 ? 's' : ''}. Deberás
              reasignarles un rol diferente.
            </p>
          ) : null}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={confirming}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Desactivando…' : 'Desactivar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
