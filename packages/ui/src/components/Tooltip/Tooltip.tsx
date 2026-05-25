import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import styles from './Tooltip.module.scss';

const TRIGGER_BUTTON_SIZE: Record<'sm' | 'md' | 'lg', 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  content: React.ReactNode;
  variant?: 'dark' | 'light' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  /** Scales the trigger child (e.g. Button) when it accepts a `size` prop */
  triggerSize?: 'sm' | 'md' | 'lg';
  delayDuration?: number;
}

export const TooltipProvider = TooltipPrimitive.Provider;

function enhanceTrigger(
  children: React.ReactElement,
  triggerSize?: 'sm' | 'md' | 'lg',
): React.ReactElement {
  if (!triggerSize) return children;

  const buttonSize = TRIGGER_BUTTON_SIZE[triggerSize];
  const existing = (children.props as { size?: string }).size;

  if (existing !== undefined) {
    return children;
  }

  return React.cloneElement(children, { size: buttonSize } as { size: string });
}

export function Tooltip({
  children,
  content,
  variant = 'brand',
  size = 'md',
  triggerSize,
  delayDuration = 300,
  ...props
}: TooltipProps) {
  const resolvedTriggerSize = triggerSize ?? size;
  const child = React.Children.only(children);

  if (!React.isValidElement(child)) {
    throw new Error('Tooltip expects a single React element child');
  }

  const triggerChild = enhanceTrigger(child, resolvedTriggerSize);

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root {...props}>
        <TooltipPrimitive.Trigger asChild>{triggerChild}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={clsx(styles.content, styles[`variant--${variant}`], styles[`size--${size}`])}
            sideOffset={6}
          >
            {content}
            <TooltipPrimitive.Arrow className={clsx(styles.arrow, styles[`arrow--${variant}`])} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
