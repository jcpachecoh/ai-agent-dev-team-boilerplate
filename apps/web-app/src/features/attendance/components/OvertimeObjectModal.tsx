import { useState } from 'react';

import styles from './OvertimeObjectModal.module.scss';

interface OvertimeObjectModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export function OvertimeObjectModal({
  open,
  loading = false,
  onClose,
  onSubmit,
}: OvertimeObjectModalProps): React.JSX.Element | null {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overtime-object-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="overtime-object-title" className={styles.title}>
          Objetar solicitud
        </h2>
        <p className={styles.help}>Indique el motivo de la objeción. Este campo es obligatorio.</p>
        <textarea
          className={styles.textarea}
          rows={4}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError(null);
          }}
        />
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitButton}
            disabled={loading}
            onClick={() => {
              const trimmed = comment.trim();
              if (!trimmed) {
                setError('El comentario es obligatorio.');
                return;
              }
              onSubmit(trimmed);
            }}
          >
            Objetar
          </button>
        </div>
      </div>
    </div>
  );
}
