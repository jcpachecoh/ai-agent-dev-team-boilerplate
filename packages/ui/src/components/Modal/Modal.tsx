import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { AlertTriangle, X } from 'lucide-react';
import styles from './Modal.module.scss';
import { Button } from '../Button';

export interface ModalProps extends DialogPrimitive.DialogProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  theme?: 'light' | 'dark';
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
  onInteractOutside?: (event: Event) => void;
  /** Icon shown above title when `headerLayout` is centered */
  headerIcon?: React.ReactNode;
  headerIconTone?: 'warning' | 'danger';
  headerLayout?: 'start' | 'centered';
  confirmLayout?: boolean;
  footerLayout?: 'end' | 'stacked';
  className?: string;
}

export function Modal({
  size = 'md',
  theme = 'light',
  title,
  description,
  children,
  footer,
  hideCloseButton,
  onInteractOutside,
  open,
  onOpenChange,
  headerIcon,
  headerIconTone = 'warning',
  headerLayout = 'start',
  confirmLayout = false,
  footerLayout = 'end',
  className,
  ...props
}: ModalProps) {
  const isCentered = headerLayout === 'centered' || confirmLayout;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className={clsx(styles.overlay, styles[`overlay--${theme}`])}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild onInteractOutside={onInteractOutside}>
              <motion.div
                className={clsx(
                  styles.content,
                  styles[`content--${size}`],
                  styles[`content--${theme}`],
                  confirmLayout && styles['content--confirm'],
                  className,
                )}
                initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {(title || description || headerIcon) && (
                  <div className={clsx(styles.header, isCentered && styles['header--centered'])}>
                    {headerIcon && (
                      <div
                        className={clsx(styles.headerIcon, styles[`headerIcon--${headerIconTone}`])}
                        aria-hidden
                      >
                        {headerIcon}
                      </div>
                    )}
                    {title && (
                      <DialogPrimitive.Title className={styles.title}>
                        {title}
                      </DialogPrimitive.Title>
                    )}
                    {description && (
                      <DialogPrimitive.Description className={styles.description}>
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                )}

                {children && <div className={styles.body}>{children}</div>}

                {footer && (
                  <div
                    className={clsx(
                      styles.footer,
                      footerLayout === 'stacked' && styles['footer--stacked'],
                    )}
                  >
                    {footer}
                  </div>
                )}

                {!hideCloseButton && (
                  <DialogPrimitive.Close className={styles.closeButton} aria-label="Cerrar">
                    <X size={16} aria-hidden />
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export interface ConfirmModalProps extends Omit<ModalProps, 'footer' | 'children'> {
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  confirmButtonColor?: string;
}

export function ConfirmModal({
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  open,
  onOpenChange,
  confirmButtonColor,
  theme = 'dark',
  ...props
}: ConfirmModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const isDanger = confirmVariant === 'danger';
  const finalConfirmColor = confirmButtonColor ?? (isDanger ? '#dc3545' : '#d4a017');

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      theme={theme}
      confirmLayout
      headerLayout="centered"
      headerIcon={<AlertTriangle size={28} strokeWidth={2} aria-hidden />}
      headerIconTone={isDanger ? 'danger' : 'warning'}
      footerLayout="stacked"
      title={props.title ?? '¿Confirmar entrega?'}
      description={
        props.description ??
        'Se marcará el viaje como completado y se enviará notificación a los destinatarios.'
      }
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="medium"
            onClick={() => {
              onConfirm();
              onOpenChange?.(false);
            }}
            style={
              isDanger
                ? {
                    backgroundColor: finalConfirmColor,
                    borderColor: finalConfirmColor,
                    color: '#fff',
                  }
                : {
                    backgroundColor: finalConfirmColor,
                    borderColor: finalConfirmColor,
                    color: '#fff',
                  }
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
      {...props}
    />
  );
}
