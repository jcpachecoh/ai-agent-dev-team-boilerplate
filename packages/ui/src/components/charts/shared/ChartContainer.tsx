import * as React from 'react';

import { EmptyState } from '../../feedback/empty-state';
import { Skeleton } from '../../feedback/skeleton';
import styles from './ChartContainer.module.scss';
import type { ChartBaseProps } from './types';

export interface ChartContainerProps extends ChartBaseProps {
  children?: React.ReactNode;
  height?: number | string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  theme = 'light',
  size = 'md',
  loading = false,
  empty = false,
  emptyTitle = 'No hay datos',
  emptyDescription = 'No se encontraron datos para mostrar en este gráfico.',
  ariaLabel,
  className,
  children,
  height = '100%',
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div
      className={[styles.container, sizeClass, themeClass, className].filter(Boolean).join(' ')}
      role="img"
      aria-label={ariaLabel}
      style={{
        ['--chart-body-height' as string]: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      {loading ? (
        <div className={styles.stateWrapper}>
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        </div>
      ) : empty ? (
        <div className={styles.stateWrapper}>
          <EmptyState
            variant="search"
            theme={theme}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        <div className={styles.chartBody} style={{ height }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;
