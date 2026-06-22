import type { JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoModal.module.scss';

export interface EmpleadoModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoModal({
  open = true,
  title = 'Editar empleado',
  subtitle,
  children,
  footer,
  onClose,
  closeLabel = 'Cerrar',
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoModalProps): JSX.Element | null {
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

export default EmpleadoModal;
