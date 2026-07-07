import { useCallback, useEffect, useState, type JSX } from 'react';

import styles from './DoubleTapActionButton.module.scss';

const CONFIRM_WINDOW_MS = 2000;

export interface DoubleTapActionButtonProps {
  onConfirm: () => void;
  confirmHint?: string;
  className?: string;
  children: (handlers: { onClick: () => void }) => JSX.Element;
}

export function DoubleTapActionButton({
  onConfirm,
  confirmHint = 'Toca de nuevo para confirmar',
  children,
  className,
}: DoubleTapActionButtonProps): JSX.Element {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(id);
  }, [armed]);

  const handleClick = useCallback(() => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  }, [armed, onConfirm]);

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {armed && (
        <p className={styles.hint} role="status">
          {confirmHint}
        </p>
      )}
      {children({ onClick: handleClick })}
    </div>
  );
}

export default DoubleTapActionButton;
