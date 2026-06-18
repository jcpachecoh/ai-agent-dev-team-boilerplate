import type { JSX } from 'react';

import { Checkbox, type CheckboxProps } from '../../Checkbox/Checkbox';
import type { RolTheme } from '../shared/rol-types';
import styles from './RolCheckbox.module.scss';

export interface RolCheckboxProps extends Omit<CheckboxProps, 'theme'> {
  theme?: RolTheme;
}

export function RolCheckbox({
  theme = 'dark',
  className,
  ...props
}: RolCheckboxProps): JSX.Element {
  return (
    <Checkbox
      theme={theme}
      size="md"
      className={[styles.checkbox, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export default RolCheckbox;
