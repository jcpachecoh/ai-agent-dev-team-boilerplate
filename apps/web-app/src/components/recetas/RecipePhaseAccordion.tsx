import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from 'lucide-react';

import type { UiTheme } from '@/constants/theme';
import { getPhaseTypeLabel } from '@/features/recetas/constants/recipePhaseCatalogs';
import { clearConditionalPhaseFields } from '@/features/recetas/mappers/phases.mapper';
import type { RecipeCompositionRow, RecipePhaseFormRow } from '@/features/recetas/types';

import { RecipePhaseFormFields } from './RecipePhaseFormFields';
import styles from './RecipePhaseAccordion.module.scss';

interface RecipePhaseAccordionProps {
  rows: RecipePhaseFormRow[];
  compositionRows: RecipeCompositionRow[];
  theme: UiTheme;
  readOnly?: boolean;
  fieldErrors?: Record<string, string>;
  onRowsChange: (rows: RecipePhaseFormRow[]) => void;
  onRemoveRow: (rowId: string) => void;
  onMoveRow: (rowId: string, direction: 'up' | 'down') => void;
}

function getRowFieldErrors(
  fieldErrors: Record<string, string>,
  index: number,
): Record<string, string> {
  const prefix = `phases.${index}.`;
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}

export function RecipePhaseAccordion({
  rows,
  compositionRows,
  theme,
  readOnly = false,
  fieldErrors = {},
  onRowsChange,
  onRemoveRow,
  onMoveRow,
}: RecipePhaseAccordionProps) {
  const updateRow = (rowId: string, patch: Partial<RecipePhaseFormRow>): void => {
    onRowsChange(
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        if (patch.phaseType !== undefined && patch.phaseType !== row.phaseType) {
          return clearConditionalPhaseFields({ ...row, ...patch }, patch.phaseType);
        }
        return { ...row, ...patch };
      }),
    );
  };

  const toggleExpanded = (rowId: string): void => {
    onRowsChange(rows.map((row) => (row.id === rowId ? { ...row, expanded: !row.expanded } : row)));
  };

  return (
    <div className={styles.list}>
      {rows.map((row, index) => {
        const rowErrors = getRowFieldErrors(fieldErrors, index);
        const panelId = `phase-panel-${row.id}`;
        const headerId = `phase-header-${row.id}`;

        return (
          <article key={row.id} className={styles.card}>
            <header className={styles.header}>
              <button
                type="button"
                className={styles.toggle}
                aria-expanded={row.expanded}
                aria-controls={panelId}
                id={headerId}
                onClick={() => toggleExpanded(row.id)}
              >
                <span className={styles.index}>Fase {index + 1}</span>
                <span className={styles.summary}>
                  {getPhaseTypeLabel(row.phaseType)} · {row.standardMinutes || 0} min
                </span>
                <ChevronDown
                  className={[styles.chevron, row.expanded ? styles.chevronOpen : ''].join(' ')}
                  size={16}
                  aria-hidden
                />
              </button>

              {!readOnly ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Subir fase"
                    disabled={index === 0}
                    onClick={() => onMoveRow(row.id, 'up')}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Bajar fase"
                    disabled={index === rows.length - 1}
                    onClick={() => onMoveRow(row.id, 'down')}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className={[styles.iconButton, styles.iconButtonDanger].join(' ')}
                    aria-label="Eliminar fase"
                    onClick={() => onRemoveRow(row.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : null}
            </header>

            {row.expanded ? (
              <div id={panelId} role="region" aria-labelledby={headerId} className={styles.body}>
                <RecipePhaseFormFields
                  row={row}
                  compositionRows={compositionRows}
                  theme={theme}
                  readOnly={readOnly}
                  fieldErrors={rowErrors}
                  onChange={(patch) => updateRow(row.id, patch)}
                />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
