import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import clsx from 'clsx';
import styles from './Popover.module.scss';

export interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  content: React.ReactNode;
  align?: PopoverPrimitive.PopoverContentProps['align'];
  side?: PopoverPrimitive.PopoverContentProps['side'];
  sideOffset?: number;
  showArrow?: boolean;
}

export function Popover({
  children,
  content,
  align = 'center',
  side = 'bottom',
  sideOffset = 5,
  showArrow = true,
  ...props
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root {...props}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={styles.content}
          collisionPadding={10}
        >
          {content}
          {showArrow && <PopoverPrimitive.Arrow className={styles.arrow} width={11} height={5} />}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
