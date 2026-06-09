import { RecetaResultButton, RecetaUtilityButton } from '@restopsiq/ui';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { ProcessRow } from '@/features/recetas/types';

import styles from './ProcessListCard.module.scss';

export interface ProcessListCardProps {
  row: ProcessRow;
  theme: UiTheme;
}

export function ProcessListCard({ row, theme }: ProcessListCardProps): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.code}>{row.code}</span>
          <span className={styles.name}>{row.name}</span>
        </span>
      }
      badge={<RecetaResultButton variant={row.result} theme={theme} size="sm" label={row.status} />}
      fields={[
        { label: 'Categoría', value: row.category },
        { label: 'Fases', value: String(row.phases) },
        { label: 'Duración', value: row.duration },
        { label: 'Última validación', value: row.lastValidation },
        { label: 'Salud ejecución', value: `${row.health}%` },
      ]}
      footer={
        <>
          <RecetaUtilityButton theme={theme} size="sm" variant="view" />
          <RecetaUtilityButton theme={theme} size="sm" variant="pdf" />
        </>
      }
    />
  );
}
