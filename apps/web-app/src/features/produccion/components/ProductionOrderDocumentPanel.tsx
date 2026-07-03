import {
  InventarioDateField,
  InventarioFormActions,
  InventarioPrimaryButton,
  InventarioSelect,
  toast,
} from '@restopsiq/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useUiTheme } from '@/hooks/useUiTheme';
import { STOCK_UNIT_OPTIONS } from '@/types/inventory';

import { PlantApiError } from '@/api/plant/client';
import { useUpdateProductionOrderDocument } from '../hooks/useProductionOrders';
import {
  QUALITY_CHECK_LABELS,
  dateInputToIso,
  documentFormFromOrder,
  emptyByproductRow,
  qualityChecksForDisplay,
  type ProductionOrderDocumentFormState,
} from '../mappers/document-form';
import { formatStockUnitLabel } from '../mappers/display';
import type { ProductionOrderDetail } from '../types';
import { ProductionOrderDocumentHeaderFields } from './ProductionOrderDocumentHeaderFields';
import styles from '../produccion.module.scss';

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'No se pudo guardar el documento.';
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function displayValue(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const text = String(value).trim();
  return text || '—';
}

export interface ProductionOrderDocumentPanelProps {
  order: ProductionOrderDetail;
}

export function ProductionOrderDocumentPanel({
  order,
}: ProductionOrderDocumentPanelProps): React.JSX.Element {
  const theme = useUiTheme();
  const documentMutation = useUpdateProductionOrderDocument();
  const readOnly = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const headerEditable = !readOnly && (order.status === 'DRAFT' || order.status === 'PLANNED');

  const [form, setForm] = useState<ProductionOrderDocumentFormState>(() =>
    documentFormFromOrder(order),
  );

  useEffect(() => {
    setForm(documentFormFromOrder(order));
  }, [order]);

  const qualityRows = useMemo(
    () => qualityChecksForDisplay(order.qualityChecks),
    [order.qualityChecks],
  );

  const materials = order.materials ?? [];

  const handleSave = async () => {
    try {
      const documentInput = {
        ...(headerEditable
          ? {
              lotNumber: form.header.lotNumber.trim() || null,
              productionDate: dateInputToIso(form.header.productionDate) ?? null,
              deliveryDate: dateInputToIso(form.header.deliveryDate) ?? null,
              notes: form.header.notes.trim() || null,
            }
          : {}),
        byproducts: form.byproducts
          .filter((row) => row._delete || row.itemName.trim())
          .map((row) => ({
            ...(row.id ? { id: row.id } : {}),
            itemName: row.itemName.trim(),
            unit: row.unit,
            actualQuantity: row.actualQuantity.trim() || null,
            lotNumber: row.lotNumber.trim() || null,
            expirationDate: dateInputToIso(row.expirationDate) ?? null,
            ...(row._delete ? { _delete: true } : {}),
          })),
      };

      await documentMutation.mutateAsync({ id: order.id, input: documentInput });
      toast.success('Documento de producción guardado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saving = documentMutation.isPending;

  return (
    <section className={styles.detailPanel} aria-label="Documento de producción">
      <h2 className={styles.detailSectionTitle}>Documento OP</h2>
      <p className={styles.hint}>
        La cantidad de batches a producir define el snapshot de materiales al planificar. Rutas y
        calidad se completan automáticamente desde la ejecución en planta.
      </p>

      <div className={styles.modalFormGrid}>
        <ProductionOrderDocumentHeaderFields
          batchCount={order.batchCount}
          packageWeight={order.packageWeight}
          value={form.header}
          onChange={(header) => setForm((prev) => ({ ...prev, header }))}
          disabled={!headerEditable}
        />
      </div>

      <h3 className={styles.documentSubheading}>Materiales</h3>
      {materials.length === 0 ? (
        <p className={styles.hint}>
          Sin materiales. Planifique la OP para generar cantidades requeridas según los{' '}
          {order.batchCount} lote(s).
        </p>
      ) : (
        <div className={styles.documentTableWrap}>
          <table className={styles.documentTable}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Cant. requerida</th>
                <th>Unidad</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.materialName}</td>
                  <td>{material.requiredQuantity}</td>
                  <td>{formatStockUnitLabel(material.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className={styles.documentSubheading}>Rutas de proceso</h3>
      <p className={styles.hint}>Información de fases — solo lectura, actualizada desde planta.</p>
      <div className={styles.documentTableWrap}>
        <table className={styles.documentTable}>
          <thead>
            <tr>
              <th>Operación</th>
              <th>Hora inicial</th>
              <th>Hora final</th>
              <th>N° oper.</th>
              <th>Cant. entregada</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {order.executions.map((execution) => (
              <tr key={execution.id}>
                <td>{execution.phaseName}</td>
                <td>{formatTime(execution.startedAt)}</td>
                <td>{formatTime(execution.completedAt)}</td>
                <td>{displayValue(execution.operatorCount)}</td>
                <td>{displayValue(execution.deliveredQuantity)}</td>
                <td>{displayValue(execution.responsibleName)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={styles.documentSubheading}>Liberación MP / Calidad</h3>
      <p className={styles.hint}>Información de calidad — solo lectura, registrada en planta.</p>
      <div className={styles.documentTableWrap}>
        <table className={styles.documentTable}>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Temperatura</th>
              <th>Color</th>
              <th>Olor</th>
              <th>Textura</th>
            </tr>
          </thead>
          <tbody>
            {qualityRows.map((check) => (
              <tr key={check.checkType}>
                <td>{QUALITY_CHECK_LABELS[check.checkType]}</td>
                <td>{displayValue(check.temperature)}</td>
                <td>{displayValue(check.color)}</td>
                <td>{displayValue(check.smell)}</td>
                <td>{displayValue(check.texture)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.documentSubheadingRow}>
        <h3 className={styles.documentSubheading}>Coproductos</h3>
        {!readOnly && (
          <InventarioPrimaryButton
            theme={theme}
            size="sm"
            variant="ghost"
            label="Agregar coproducto"
            icon={<Plus size={14} aria-hidden />}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                byproducts: [...prev.byproducts, emptyByproductRow()],
              }))
            }
          />
        )}
      </div>

      {form.byproducts.length === 0 ? (
        <p className={styles.hint}>Sin coproductos registrados.</p>
      ) : (
        <div className={styles.documentTableWrap}>
          <table className={styles.documentTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>UM</th>
                <th>Cantidad real</th>
                <th>Lote</th>
                <th>Vence</th>
                {!readOnly && <th aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {form.byproducts.map((byproduct, index) =>
                byproduct._delete ? null : (
                  <tr key={byproduct.id ?? `new-${index}`}>
                    <td>
                      <input
                        className={styles.tableInput}
                        type="text"
                        value={byproduct.itemName}
                        disabled={readOnly}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            byproducts: prev.byproducts.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, itemName: event.target.value } : row,
                            ),
                          }))
                        }
                        aria-label="Nombre del coproducto"
                      />
                    </td>
                    <td>
                      <div className={styles.documentCellControl}>
                        <InventarioSelect
                          theme={theme}
                          size="sm"
                          value={byproduct.unit}
                          disabled={readOnly}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              byproducts: prev.byproducts.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, unit: value } : row,
                              ),
                            }))
                          }
                          options={STOCK_UNIT_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          aria-label="Unidad del coproducto"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        className={styles.tableInput}
                        type="text"
                        inputMode="decimal"
                        value={byproduct.actualQuantity}
                        disabled={readOnly}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            byproducts: prev.byproducts.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, actualQuantity: event.target.value }
                                : row,
                            ),
                          }))
                        }
                        aria-label="Cantidad real del coproducto"
                      />
                    </td>
                    <td>
                      <input
                        className={styles.tableInput}
                        type="text"
                        value={byproduct.lotNumber}
                        disabled={readOnly}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            byproducts: prev.byproducts.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, lotNumber: event.target.value } : row,
                            ),
                          }))
                        }
                        aria-label="Lote del coproducto"
                      />
                    </td>
                    <td>
                      <div className={styles.documentCellControl}>
                        <InventarioDateField
                          theme={theme}
                          size="sm"
                          value={byproduct.expirationDate}
                          disabled={readOnly}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              byproducts: prev.byproducts.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, expirationDate: value } : row,
                              ),
                            }))
                          }
                          aria-label="Fecha de vencimiento del coproducto"
                        />
                      </div>
                    </td>
                    {!readOnly && (
                      <td>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              byproducts: prev.byproducts.flatMap((row, rowIndex) => {
                                if (rowIndex !== index) return [row];
                                if (row.id) return [{ ...row, _delete: true }];
                                return [];
                              }),
                            }))
                          }
                          aria-label="Eliminar coproducto"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {!readOnly && (
        <InventarioFormActions
          theme={theme}
          size="md"
          onCancel={() => setForm(documentFormFromOrder(order))}
          onSave={() => void handleSave()}
          cancelLabel="Descartar cambios"
          saveLabel="Guardar documento"
          saveAccent="orange"
          saveLoading={saving}
        />
      )}
    </section>
  );
}
