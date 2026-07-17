import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700',
  secondary: 'bg-white text-brand-900 border border-neutral-200 hover:bg-neutral-50',
  outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50',
  ghost: 'text-brand-600 hover:bg-brand-50',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type ButtonAsButton = ButtonOwnProps & ComponentPropsWithoutRef<'button'> & { href?: undefined };
type ButtonAsLink = ButtonOwnProps & ComponentPropsWithoutRef<typeof Link> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  const classes = cn(BASE, VARIANT_STYLES[variant], SIZE_STYLES[size], className);

  if (props.href !== undefined) {
    const { href, ...linkProps } = props;
    return <Link href={href} className={classes} {...linkProps} />;
  }

  return <button className={classes} {...props} />;
}
