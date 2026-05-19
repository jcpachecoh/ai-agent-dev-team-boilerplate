import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { X } from 'lucide-react';
import styles from './Modal.module.scss';
import { Button } from '../Button';

export interface ModalProps extends DialogPrimitive.DialogProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
  onInteractOutside?: (event: Event) => void;
  /** optional top icon/badge rendered above the header (absolute) */
  topIcon?: React.ReactNode;
  /** optional color applied to icon elements (hex or CSS color) */
  iconColor?: string;
  /** optional extra class to apply to the content wrapper */
  className?: string;
  /** optional class for the badge wrapper */
  badgeClassName?: string;
}

export function Modal({
  size = 'md',
  title,
  description,
  children,
  footer,
  hideCloseButton,
  onInteractOutside,
  open,
  onOpenChange,
  topIcon,
  iconColor,
  ...props
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild onInteractOutside={onInteractOutside}>
              <motion.div
                className={clsx(styles.content, styles[`content--${size}`], props.className)}
                initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {(title || description) && (
                  <div className={styles.header}>
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

                <div className={styles.body}>{children}</div>

                {footer && <div className={styles.footer}>{footer}</div>}

                {!hideCloseButton && (
                  <DialogPrimitive.Close className={styles.closeButton} aria-label="Close">
                    <X size={16} />
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
  iconColor?: string;
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
  iconColor,
  ...props
}: ConfirmModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };
  const imgIcon = 'https://www.figma.com/api/mcp/asset/f80baeaf-4a1f-48c1-955a-772561cd2f2c';

  const modalSize = props.size ?? 'sm';
  const variantColorMap: Record<string, string> = {
    primary: '#0057ff',
    danger: '#dc3545',
  };
  // Default: use explicit confirmButtonColor if provided.
  // Otherwise, use red for danger, and the yellow we used across modals for other variants.
  const finalConfirmColor =
    confirmButtonColor ?? (confirmVariant === 'danger' ? variantColorMap['danger'] : '#d4a017');
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size={modalSize}
      topIcon={<img src={imgIcon} alt="icon" />}
      iconColor={iconColor}
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
            style={{
              backgroundColor: finalConfirmColor,
              borderColor: finalConfirmColor,
              color: '#fff',
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
      {...props}
    />
  );
}
