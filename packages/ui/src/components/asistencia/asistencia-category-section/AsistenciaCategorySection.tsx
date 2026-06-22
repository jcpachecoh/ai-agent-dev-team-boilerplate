import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaCategorySection.module.scss';

export interface AsistenciaCategorySectionProps {
  title: string;
  count: number;
  children?: ReactNode;
  emptyMessage?: string;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaCategorySection({
  title,
  count,
  children,
  emptyMessage = 'Sin registros en esta categoría.',
  theme = 'dark',
  className,
}: AsistenciaCategorySectionProps): JSX.Element {
  const hasChildren = Boolean(children);

  return (
    <section
      className={[styles.section, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.count}>({count})</span>
        </div>
      </div>
      <div className={styles.body}>
        {hasChildren ? children : <p className={styles.empty}>{emptyMessage}</p>}
      </div>
    </section>
  );
}

export default AsistenciaCategorySection;
