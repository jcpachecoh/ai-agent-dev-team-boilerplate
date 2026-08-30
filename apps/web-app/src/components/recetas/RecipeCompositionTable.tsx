import { RecetaFilterSelect } from '@restopsiq/ui';
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import type { UiTheme } from '@/constants/theme';

import type { SupplyItemApi } from '@/features/inventario/types';
import {
  RECIPE_COMPONENT_TYPE_OPTIONS,
  RECIPE_USAGE_UNIT_OPTIONS,
  type RecipeComponentType,
  type RecipeCompositionRow,
  type RecipeUsageUnit,
} from '@/features/recetas/types';
import {
  calculateShrinkagePercent,
  isUsageUnitMismatch,
  mapSupplyItemToCompositionFields,
} from '@/features/recetas/mappers/composition.mapper';

import { SupplyItemAutocomplete } from './SupplyItemAutocomplete';
import styles from './RecipeCompositionTable.module.scss';

interface RecipeCompositionTableProps {
  rows: RecipeCompositionRow[];
  supplyItems: SupplyItemApi[];
  supplyItemsLoading?: boolean;
  readOnly?: boolean;
  theme?: UiTheme;
  fieldErrors?: Record<string, string>;
  onRowsChange: (rows: RecipeCompositionRow[]) => void;
  onRemoveRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onMoveRow: (rowId: string, direction: 'up' | 'down') => void;
}

function reorderRows(rows: RecipeCompositionRow[]): RecipeCompositionRow[] {
  return rows.map((row, index) => ({ ...row, sortOrder: index }));
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  );
}

export function RecipeCompositionTable({
  rows,
  supplyItems,
  supplyItemsLoading = false,
  readOnly = false,
  theme = 'light',
  fieldErrors = {},
  onRowsChange,
  onRemoveRow,
  onDuplicateRow,
  onMoveRow,
}: RecipeCompositionTableProps) {
  const updateRow = (rowId: string, patch: Partial<RecipeCompositionRow>): void => {
    onRowsChange(reorderRows(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row))));
  };

  return (
    <div className={styles.list}>
      {rows.map((row, index) => {
        const rowPrefix = `composition.${index}`;
        const supplyError = fieldErrors[`${rowPrefix}.supplyItemId`];
        const componentError = fieldErrors[`${rowPrefix}.componentType`];
        const unitError = fieldErrors[`${rowPrefix}.usageUnit`];
        const grossError = fieldErrors[`${rowPrefix}.grossQuantity`];
        const netError = fieldErrors[`${rowPrefix}.netQuantity`];
        const unitMismatch = isUsageUnitMismatch(row);
        const shrinkage =
          row.grossQuantity && row.netQuantity
            ? `${calculateShrinkagePercent(row.grossQuantity, row.netQuantity)}%`
            : '—';

        return (
          <article key={row.id} className={styles.rowCard}>
            <header className={styles.rowHeader}>
              <span className={styles.rowIndex}>Componente {index + 1}</span>
              {!readOnly ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Subir fila"
                    disabled={index === 0}
                    onClick={() => onMoveRow(row.id, 'up')}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Bajar fila"
                    disabled={index === rows.length - 1}
                    onClick={() => onMoveRow(row.id, 'down')}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Duplicar fila"
                    onClick={() => onDuplicateRow(row.id)}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    className={[styles.iconButton, styles.iconButtonDanger].join(' ')}
                    aria-label="Eliminar fila"
                    onClick={() => onRemoveRow(row.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : null}
            </header>

            <div className={styles.rowGrid}>
              <Field label="Código de insumo" className={styles.fieldWide}>
                {readOnly ? (
                  <span className={styles.readonlyValue}>{row.supplyItemCode || '—'}</span>
                ) : (
                  <>
                    <SupplyItemAutocomplete
                      items={supplyItems}
                      code={row.supplyItemCode}
                      selectedItemId={row.supplyItemId}
                      loading={supplyItemsLoading}
                      error={supplyError}
                      placeholder="Buscar por código o nombre"
                      onCodeChange={(code) =>
                        updateRow(row.id, {
                          supplyItemCode: code,
                          supplyItemId: '',
                          supplyItemName: '',
                          supplyItemBaseUnit: undefined,
                        })
                      }
                      onSelect={(item) => updateRow(row.id, mapSupplyItemToCompositionFields(item))}
                    />
                    {supplyError ? <span className={styles.cellError}>{supplyError}</span> : null}
                  </>
                )}
              </Field>

              <Field label="Nombre del insumo">
                <span
                  className={[
                    styles.readonlyValue,
                    !row.supplyItemName ? styles.readonlyValueMuted : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {row.supplyItemName || 'Se autocompleta al seleccionar'}
                </span>
              </Field>

              <Field label="Tipo de componente">
                {readOnly ? (
                  <span className={styles.readonlyValue}>
                    {RECIPE_COMPONENT_TYPE_OPTIONS.find((o) => o.value === row.componentType)
                      ?.label ?? '—'}
                  </span>
                ) : (
                  <>
                    <RecetaFilterSelect
                      theme={theme}
                      size="md"
                      className={styles.selectWrap}
                      value={row.componentType}
                      placeholder="Seleccionar"
                      aria-label="Tipo de componente"
                      options={RECIPE_COMPONENT_TYPE_OPTIONS}
                      onChange={(value) =>
                        updateRow(row.id, { componentType: value as RecipeComponentType })
                      }
                    />
                    {componentError ? (
                      <span className={styles.cellError}>{componentError}</span>
                    ) : null}
                  </>
                )}
              </Field>

              <Field label="Unidad de uso">
                {readOnly ? (
                  <span className={styles.readonlyValue}>
                    {RECIPE_USAGE_UNIT_OPTIONS.find((o) => o.value === row.usageUnit)?.label ?? '—'}
                  </span>
                ) : (
                  <>
                    <RecetaFilterSelect
                      theme={theme}
                      size="md"
                      className={styles.selectWrap}
                      value={row.usageUnit}
                      placeholder="Seleccionar"
                      aria-label="Unidad de uso"
                      options={RECIPE_USAGE_UNIT_OPTIONS}
                      onChange={(value) =>
                        updateRow(row.id, { usageUnit: value as RecipeUsageUnit })
                      }
                    />
                    {unitMismatch ? (
                      <span className={styles.warning}>
                        La unidad difiere de la unidad base del insumo
                      </span>
                    ) : null}
                    {unitError ? <span className={styles.cellError}>{unitError}</span> : null}
                  </>
                )}
              </Field>

              <div className={styles.fieldQuantities}>
                <Field label="Cantidad bruta">
                  {readOnly ? (
                    <span className={styles.readonlyValue}>{row.grossQuantity || '—'}</span>
                  ) : (
                    <>
                      <input
                        className={styles.control}
                        inputMode="decimal"
                        placeholder="0.000"
                        value={row.grossQuantity}
                        aria-invalid={Boolean(grossError)}
                        onChange={(event) =>
                          updateRow(row.id, { grossQuantity: event.target.value })
                        }
                      />
                      {grossError ? <span className={styles.cellError}>{grossError}</span> : null}
                    </>
                  )}
                </Field>

                <Field label="Cantidad neta">
                  {readOnly ? (
                    <span className={styles.readonlyValue}>{row.netQuantity || '—'}</span>
                  ) : (
                    <>
                      <input
                        className={styles.control}
                        inputMode="decimal"
                        placeholder="0.000"
                        value={row.netQuantity}
                        aria-invalid={Boolean(netError)}
                        onChange={(event) => updateRow(row.id, { netQuantity: event.target.value })}
                      />
                      {netError ? <span className={styles.cellError}>{netError}</span> : null}
                    </>
                  )}
                </Field>

                <Field label="% Merma">
                  <span className={[styles.readonlyValue, styles.shrinkageValue].join(' ')}>
                    {shrinkage}
                  </span>
                </Field>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
