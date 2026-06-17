import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

import styles from './Toast.module.scss';

type SonnerToasterProps = React.ComponentProps<typeof SonnerToaster>;

export type ToastSize = 'compact' | 'comfortable' | 'wide';

export interface ToastProps extends SonnerToasterProps {
  size?: ToastSize;
}

export const Toaster = ({
  className,
  closeButton = true,
  position = 'top-right',
  richColors = false,
  size = 'comfortable',
  toastOptions,
  visibleToasts = 4,
  ...props
}: ToastProps): React.JSX.Element => {
  const sizeClass = styles[size] ?? styles.comfortable;

  return (
    <SonnerToaster
      className={[styles.toaster, sizeClass, className].filter(Boolean).join(' ')}
      closeButton={closeButton}
      position={position}
      richColors={richColors}
      visibleToasts={visibleToasts}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          toast: styles.toast,
          title: styles.title,
          description: styles.description,
          content: styles.content,
          icon: styles.icon,
          actionButton: styles.actionButton,
          cancelButton: styles.cancelButton,
          closeButton: styles.closeButton,
          default: styles.defaultToast,
          error: styles.errorToast,
          info: styles.infoToast,
          loading: styles.loadingToast,
          success: styles.successToast,
          warning: styles.warningToast,
        },
      }}
      {...props}
    />
  );
};

export { toast } from 'sonner';
