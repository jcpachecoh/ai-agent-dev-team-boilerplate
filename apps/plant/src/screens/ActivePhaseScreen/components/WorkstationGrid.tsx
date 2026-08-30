import type { PlantLayoutMode } from '@restopsiq/ui';
import type { JSX, ReactNode } from 'react';

import styles from './WorkstationGrid.module.scss';

export interface WorkstationGridProps {
  layoutMode: PlantLayoutMode;
  children: ReactNode[];
}

export function WorkstationGrid({ layoutMode, children }: WorkstationGridProps): JSX.Element {
  const visibleCount = layoutMode === '1x1' ? 1 : layoutMode === '1x2' ? 2 : 4;
  const visibleChildren = children.slice(0, visibleCount);

  return (
    <div
      className={[styles.grid, styles[`mode--${layoutMode}`]].join(' ')}
      data-testid="workstation-grid"
      data-layout-mode={layoutMode}
    >
      {visibleChildren.map((child, index) => (
        <div key={index} className={styles.cell}>
          {child}
        </div>
      ))}
    </div>
  );
}

export default WorkstationGrid;
