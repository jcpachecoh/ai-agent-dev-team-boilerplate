import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { X } from 'lucide-react';
import styles from './Drawer.module.scss';

// Let's create a simple hook inline just for mobile detection if needed, or rely on css.
// Since we don't have the hook ready, we'll just implement the layout logic.

export interface DrawerProps extends DialogPrimitive.DialogProps {
  side?: 'left' | 'right' | 'bottom' | 'top';
  size?: 'sm' | 'md' | 'lg';
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

const slideVariants = {
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
};

export function Drawer({
  side = 'right',
  size = 'md',
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  ...props
}: DrawerProps) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const actualSide = side;

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
                transition={{ duration: 0.3 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                className={clsx(
                  styles.content,
                  styles[`side--${actualSide}`],
                  styles[`size--${size}`],
                )}
                initial={slideVariants[actualSide].initial}
                animate={slideVariants[actualSide].animate}
                exit={slideVariants[actualSide].exit}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag={
                  actualSide === 'bottom' || actualSide === 'top'
                    ? 'y'
                    : actualSide === 'right' || actualSide === 'left'
                      ? 'x'
                      : undefined
                }
                dragConstraints={undefined}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  // Bottom: swipe down to close
                  if (actualSide === 'bottom' && (offset.y > 100 || velocity.y > 500)) {
                    onOpenChange?.(false);
                  }
                  // Top: swipe up to close (negative offset)
                  if (actualSide === 'top' && (offset.y < -100 || velocity.y < -500)) {
                    onOpenChange?.(false);
                  }
                  // Right: swipe right to close
                  if (actualSide === 'right' && (offset.x > 100 || velocity.x > 500)) {
                    onOpenChange?.(false);
                  }
                  // Left: swipe left to close (negative offset)
                  if (actualSide === 'left' && (offset.x < -100 || velocity.x < -500)) {
                    onOpenChange?.(false);
                  }
                }}
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

                <DialogPrimitive.Close className={styles.closeButton} aria-label="Close">
                  <X size={16} />
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
