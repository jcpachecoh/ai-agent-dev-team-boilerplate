import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedePage.module.scss';

export interface SedePageProps {
  children?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  /** `sections` = full-bleed rows like Recetas; `padded` = inset page (forms). */
  layout?: 'sections' | 'padded';
  className?: string;
}

export function SedePage({
  children,
  theme = 'light',
  size = 'md',
  layout = 'padded',
  className,
}: SedePageProps): JSX.Element {
  return (
    <div
      className={[
        styles.page,
        styles[`layout--${layout}`],
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default SedePage;
