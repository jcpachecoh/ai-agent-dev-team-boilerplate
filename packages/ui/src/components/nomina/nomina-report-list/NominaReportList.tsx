import type { JSX, ReactNode } from 'react';

import type { NominaReportDefinition, NominaTheme } from '../shared/nomina-types';
import { NominaReportItem } from './NominaReportItem';
import styles from './NominaReportList.module.scss';

export interface NominaReportListProps {
  title?: string;
  items: NominaReportDefinition[];
  renderIcon?: (item: NominaReportDefinition) => ReactNode;
  onDownload?: (item: NominaReportDefinition) => void;
  theme?: NominaTheme;
  className?: string;
}

export function NominaReportList({
  title = 'Reportes disponibles',
  items,
  renderIcon,
  onDownload,
  theme = 'dark',
  className,
}: NominaReportListProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Exportar</p>
        <h2 className={styles.title}>{title}</h2>
      </header>
      <div className={styles.list}>
        {items.map((item) => (
          <NominaReportItem
            key={item.id}
            theme={theme}
            code={item.code}
            title={item.title}
            description={item.description}
            tone={item.tone}
            icon={renderIcon?.(item)}
            onDownload={() => onDownload?.(item)}
          />
        ))}
      </div>
    </section>
  );
}

export default NominaReportList;
