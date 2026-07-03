import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolModal.module.scss';

export interface RolModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolModal({
  open = true,
  title = 'Rol',
  subtitle,
  children,
  footer,
  onClose,
  closeLabel = 'Cerrar',
  theme = 'dark',
  size = 'md',
  className,
}: RolModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className={[styles.backdrop, styles[`theme--${theme}`]].filter(Boolean).join(' ')}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={[styles.modal, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titles}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {onClose ? (
            <button type="button" className={styles.closeButton} onClick={onClose}>
              {closeLabel}
            </button>
          ) : null}
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </section>
    </div>
  );
}

export default RolModal;
