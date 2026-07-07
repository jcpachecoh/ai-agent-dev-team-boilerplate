import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolPage.module.scss';

export interface RolPageProps {
  children?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolPage({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: RolPageProps): JSX.Element {
  return (
    <div
      className={[styles.page, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default RolPage;
