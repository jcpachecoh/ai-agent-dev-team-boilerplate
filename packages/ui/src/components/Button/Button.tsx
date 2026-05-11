import * as React from 'react';

import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps): React.JSX.Element {
  const variantClass = styles[variant] ?? styles.primary;
  const combinedClassName = [styles.button, variantClass, className].filter(Boolean).join(' ');

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
