import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import clsx from 'clsx';
import styles from './Popover.module.scss';

export interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  content: React.ReactNode;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  align?: PopoverPrimitive.PopoverContentProps['align'];
  side?: PopoverPrimitive.PopoverContentProps['side'];
  sideOffset?: number;
  showArrow?: boolean;
}

export function Popover({
  children,
  content,
  theme = 'light',
  size = 'md',
  align = 'center',
  side = 'bottom',
  sideOffset = 8,
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
          className={clsx(styles.content, styles[`content--${theme}`], styles[`content--${size}`])}
          collisionPadding={10}
        >
          <div className={styles.inner}>{content}</div>
          {showArrow && (
            <PopoverPrimitive.Arrow
              className={clsx(styles.arrow, styles[`arrow--${theme}`])}
              width={12}
              height={6}
            />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
