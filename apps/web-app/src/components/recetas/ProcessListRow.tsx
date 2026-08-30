import { RecetaProgressIndicator, RecetaResultButton, RecetaUtilityButton } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { UiTheme } from '@/constants/theme';
import type { ProcessRow } from '@/features/recetas/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './ProcessListRow.module.scss';

export interface ProcessListRowProps {
  row: ProcessRow;
  theme: UiTheme;
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
}

export function ProcessListRow({
  row,
  theme,
  visibleColumns,
  columnsTemplate,
}: ProcessListRowProps): React.JSX.Element {
  const renderCell = (columnId: string): React.ReactNode => {
    switch (columnId) {
      case 'id':
        return <span className={styles.code}>{row.code}</span>;
      case 'nombre':
        return <span className={styles.name}>{row.name}</span>;
      case 'categoria':
        return <span className={styles.muted}>{row.category}</span>;
      case 'fases':
        return <span className={[styles.muted, styles.center].join(' ')}>{row.phases}</span>;
      case 'duracion':
        return <span className={styles.muted}>{row.duration}</span>;
      case 'estado':
        return (
          <RecetaResultButton variant={row.result} theme={theme} size="sm" label={row.status} />
        );
      case 'ultima':
        return <span className={styles.muted}>{row.lastValidation}</span>;
      case 'salud':
        return (
          <RecetaProgressIndicator
            theme={theme}
            size="sm"
            value={row.health}
            max={100}
            variant={
              row.result === 'failed' ? 'danger' : row.result === 'warning' ? 'warning' : 'success'
            }
          />
        );
      case 'acciones':
        return (
          <span className={styles.actions}>
            <RecetaUtilityButton theme={theme} size="sm" variant="view" />
            <RecetaUtilityButton theme={theme} size="sm" variant="pdf" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--receta-columns': columnsTemplate } as CSSProperties}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={styles.cell} role="cell">
          {renderCell(column.id)}
        </span>
      ))}
    </div>
  );
}
