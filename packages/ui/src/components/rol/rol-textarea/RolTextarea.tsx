import type { JSX, TextareaHTMLAttributes } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolTextarea.module.scss';

export interface RolTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  theme?: RolTheme;
  size?: RolSize;
}

export function RolTextarea({
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: RolTextareaProps): JSX.Element {
  return (
    <textarea
      className={[styles.textarea, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export default RolTextarea;
