import { RecetaResultButton } from '@restopsiq/ui';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import type { RecetaResult } from '@/features/recetas/types';

import styles from './HistoryExecutionCard.module.scss';

export interface HistoryExecutionItem {
  value: string;
  code: string;
  recipeName: string;
  operatorName: string;
  date: string;
  progress: string;
  result: RecetaResult;
  validationsOk: number;
  validationsFailed: number;
  duration: string;
  observations?: string;
  phases?: Array<{ title: string; note: string; duration: string }>;
}

export interface HistoryExecutionCardProps {
  item: HistoryExecutionItem;
  theme: UiTheme;
}

const resultLabels: Record<RecetaResult, string> = {
  ok: 'OK',
  warning: 'Advertencia',
  failed: 'Fallido',
};

export function HistoryExecutionCard({
  item,
  theme,
}: HistoryExecutionCardProps): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.code}>{item.code}</span>
          <span className={styles.name}>{item.recipeName}</span>
        </span>
      }
      badge={
        <RecetaResultButton
          variant={item.result}
          theme={theme}
          size="sm"
          label={resultLabels[item.result]}
        />
      }
      fields={[
        { label: 'Operador', value: item.operatorName },
        { label: 'Fecha', value: item.date },
        { label: 'Progreso', value: item.progress },
        {
          label: 'Validaciones',
          value: `${item.validationsOk} / ${item.validationsFailed}`,
        },
        { label: 'Duración', value: item.duration },
        ...(item.observations ? [{ label: 'Observaciones', value: item.observations }] : []),
      ]}
      footer={
        item.phases && item.phases.length > 0 ? (
          <details className={styles.phases}>
            <summary>Ver fases ({item.phases.length})</summary>
            <ul>
              {item.phases.map((phase) => (
                <li key={phase.title}>
                  <strong>{phase.title}</strong> — {phase.note} ({phase.duration})
                </li>
              ))}
            </ul>
          </details>
        ) : undefined
      }
    />
  );
}
