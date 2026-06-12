import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, type JSX } from 'react';

import styles from './DeactivateUserDialog.module.scss';

export interface DeactivateUserDialogProps {
  open: boolean;
  userEmail: string;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateUserDialog({
  open,
  userEmail,
  confirming = false,
  onClose,
  onConfirm,
}: DeactivateUserDialogProps): JSX.Element | null {
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

  if (!open) {
    return null;
  }

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
            Desactivar usuario
          </h2>
        </header>

        <div className={styles.body}>
          <p className={styles.message}>
            El usuario <span className={styles.email}>{userEmail}</span> será desactivado y no podrá
            ingresar al sistema. Esta acción puede revertirse reactivando la cuenta.
          </p>
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
