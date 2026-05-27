import { BookOpen } from 'lucide-react';
import React, {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type JSX,
  type ReactNode,
} from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaNavItem.module.scss';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export interface RecetaNavItemProps {
  active?: boolean;
  label?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export function RecetaNavItem({
  active = false,
  label = 'Recetas',
  icon,
  href,
  onClick,
  theme = 'light',
  size = 'md',
  className,
}: RecetaNavItemProps): JSX.Element {
  const content = (
    <>
      <span className={styles.icon}>{icon ?? <BookOpen aria-hidden />}</span>
      <span className={styles.label}>{label}</span>
    </>
  );
  const classes = [
    styles.item,
    styles[`theme--${theme}`],
    styles[`size--${size}`],
    active && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    const anchorProps: AnchorProps = {
      href,
      onClick,
      className: classes,
      'aria-current': active ? 'page' : undefined,
    };
    return <a {...anchorProps}>{content}</a>;
  }

  const buttonProps: ButtonProps = {
    type: 'button',
    onClick,
    className: classes,
    'aria-pressed': active,
  };
  return <button {...buttonProps}>{content}</button>;
}

export default RecetaNavItem;
