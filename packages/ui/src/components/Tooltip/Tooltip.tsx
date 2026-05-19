import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import styles from './Tooltip.module.scss';

export interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  content: React.ReactNode;
  variant?: 'dark' | 'light' | 'brand';
  delayDuration?: number;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  content,
  variant = 'brand',
  delayDuration = 300,
  ...props
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root {...props}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={clsx(styles.content, styles[`variant--${variant}`])}
            sideOffset={5}
          >
            {content}
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
