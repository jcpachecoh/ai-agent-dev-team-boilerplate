import type { JSX, ReactNode } from 'react';

import type { RolTheme } from '../shared/rol-types';
import styles from './RolSplitLayout.module.scss';

export interface RolSplitLayoutProps {
  table: ReactNode;
  panel?: ReactNode;
  theme?: RolTheme;
  className?: string;
}

export function RolSplitLayout({
  table,
  panel,
  theme = 'dark',
  className,
}: RolSplitLayoutProps): JSX.Element {
  const hasPanel = Boolean(panel);

  return (
    <div
      className={[
        styles.layout,
        styles[`theme--${theme}`],
        hasPanel ? styles.withPanel : styles.fullWidth,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[styles.tablePane, hasPanel ? null : styles.tablePaneFull]
          .filter(Boolean)
          .join(' ')}
      >
        {table}
      </div>
      {hasPanel ? <div className={styles.panelPane}>{panel}</div> : null}
    </div>
  );
}

export default RolSplitLayout;
