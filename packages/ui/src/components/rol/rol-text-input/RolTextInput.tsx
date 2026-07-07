import type { InputHTMLAttributes, JSX } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolTextInput.module.scss';

export interface RolTextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  theme?: RolTheme;
  size?: RolSize;
}

export function RolTextInput({
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: RolTextInputProps): JSX.Element {
  return (
    <input
      className={[styles.input, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export default RolTextInput;
