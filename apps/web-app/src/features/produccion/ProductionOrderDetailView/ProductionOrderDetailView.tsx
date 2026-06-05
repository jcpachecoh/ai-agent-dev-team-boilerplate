import {
  InventarioDateTimeField,
  InventarioFormActions,
  InventarioFormField,
  InventarioPageToolbar,
  InventarioPrimaryButton,
  InventarioSelect,
  RecetaActionButton,
  RecetaProgressIndicator,
  RecetaUtilityButton,
  StatusBadge,
  toast,
} from '@restopsiq/ui';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import { ProductionOrderDocumentPanel } from '../components/ProductionOrderDocumentPanel';
import { PRIORITY_FORM_OPTIONS, SHIFT_FORM_OPTIONS } from '../constants';
import {
  usePlanProductionOrder,
  useProductionOrder,
  useUpdateProductionOrder,
} from '../hooks/useProductionOrders';
import { useDownloadProductionOrderPdf } from '../hooks/useDownloadProductionOrderPdf';
import {
  countCompletedPhases,
  datetimeLocalToIso,
  formatOrderStatus,
  formatPlannedDate,
  formatPriority,
  formatShift,
  isoToDatetimeLocal,
  orderStatusToBadge,
  phaseProgressVariant,
} from '../mappers/display';
import type {
  ProductionOrderDetail,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
} from '../types';
import styles from '../produccion.module.scss';

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function mapExecutionStatus(status: string): ProductionOrderStatus {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'IN_PROCESS') return 'IN_PROCESS';
  if (status === 'READY') return 'PLANNED';
  if (status === 'QA_PENDING') return 'PAUSED';
  return 'DRAFT';
}

interface EditFormState {
  batchCount: string;
  shift: ProductionShift;
  priority: ProductionPriority;
  plannedStartAt: string;
  plannedEndAt: string;
}

function formFromOrder(order: ProductionOrderDetail): EditFormState {
  return {
    batchCount: String(order.batchCount),
    shift: order.shift,
    priority: order.priority,
    plannedStartAt: isoToDatetimeLocal(order.plannedStartAt),
    plannedEndAt: isoToDatetimeLocal(order.plannedEndAt),
  };
}

export default function ProductionOrderDetailView(): React.JSX.Element {
  const theme = useUiTheme();
  const { orderId } = useParams();
  const orderQuery = useProductionOrder(orderId);
  const planMutation = usePlanProductionOrder();
  const updateMutation = useUpdateProductionOrder();
  const downloadPdfMutation = useDownloadProductionOrderPdf();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);

  const order = orderQuery.data;

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
      body: JSON.stringify({
        sessionId: 'd2ab57',
        runId: 'pre-fix',
        hypothesisId: 'A',
        location: 'ProductionOrderDetailView.tsx:mount',
        message: 'Detail view state',
        data: {
          orderId,
          isPending: orderQuery.isPending,
          isError: orderQuery.isError,
          hasOrder: Boolean(order),
          materialsCount: order?.materials?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [orderId, orderQuery.isPending, orderQuery.isError, order]);
  // #endregion

  useEffect(() => {
    if (order && editing) {
      setForm(formFromOrder(order));
    }
  }, [order, editing]);

  const plannedQuantityPreview = useMemo(() => {
    if (!order || !form) return null;
    const batches = Number.parseInt(form.batchCount, 10);
    if (!Number.isFinite(batches) || batches < 1) return null;
    const size = Number.parseFloat(String(order.plannedQuantity)) / Math.max(order.batchCount, 1);
    if (!Number.isFinite(size)) return null;
    return `${(size * batches).toFixed(3)} ${order.unit}`;
  }, [form, order]);

  if (!orderId) {
    return (
      <div className={styles.content}>
        <InventoryScreenState variant="empty" message="Orden no encontrada." />
      </div>
    );
  }

  if (orderQuery.isPending) {
    return (
      <div className={styles.content}>
        <InventoryScreenState variant="loading" message="Cargando orden de producción…" />
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(orderQuery.error)}
        </div>
        <Link to="/produccion/ordenes" className={styles.backLink}>
          Volver al listado
        </Link>
      </div>
    );
  }

  const completed = countCompletedPhases(order.executions);
  const total = order.executions.length;
  const canEdit = order.status === 'DRAFT';

  const handlePlan = async () => {
    try {
      await planMutation.mutateAsync(order.id);
      toast.success(`OP ${order.number} planificada.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSave = async () => {
    if (!form) return;
    const batches = Number.parseInt(form.batchCount, 10);
    if (!Number.isFinite(batches) || batches < 1) {
      toast.error('El número de lotes debe ser al menos 1.');
      return;
    }

    const startIso = datetimeLocalToIso(form.plannedStartAt);
    const endIso = datetimeLocalToIso(form.plannedEndAt);
    if (!startIso || !endIso) {
      toast.error('Revise las fechas planificadas.');
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error('La fecha de fin debe ser posterior al inicio.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: order.id,
        input: {
          batchCount: batches,
          shift: form.shift,
          priority: form.priority,
          plannedStartAt: startIso,
          plannedEndAt: endIso,
        },
      });
      toast.success('Orden actualizada.');
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDownloadPdf = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
      body: JSON.stringify({
        sessionId: 'd2ab57',
        runId: 'pre-fix',
        hypothesisId: 'D',
        location: 'ProductionOrderDetailView.tsx:handleDownloadPdf',
        message: 'PDF download started',
        data: { orderId: order.id, orderNumber: order.number },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      await downloadPdfMutation.mutateAsync(order.id);
      // #region agent log
      fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
        body: JSON.stringify({
          sessionId: 'd2ab57',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'ProductionOrderDetailView.tsx:handleDownloadPdf',
          message: 'PDF download succeeded',
          data: { orderId: order.id },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.success(`PDF de OP ${order.number} descargado.`);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
        body: JSON.stringify({
          sessionId: 'd2ab57',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'ProductionOrderDetailView.tsx:handleDownloadPdf',
          message: 'PDF download failed',
          data: { orderId: order.id, error: getErrorMessage(err) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className={styles.content}>
      <Link to="/produccion/ordenes" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden />
        Volver a órdenes
      </Link>

      <InventarioPageToolbar
        theme={theme}
        size="md"
        title={`OP ${order.number}`}
        subtitle={`${order.recipeName} · v${order.recipeVersion}`}
        action={
          <div className={styles.detailActions}>
            <RecetaUtilityButton
              theme={theme}
              size="sm"
              variant="pdf"
              disabled={downloadPdfMutation.isPending}
              onClick={() => void handleDownloadPdf()}
            />
            {canEdit && !editing && (
              <>
                <RecetaActionButton
                  theme={theme}
                  size="sm"
                  accent="orange"
                  variant="soft"
                  label="Planificar"
                  loading={planMutation.isPending}
                  onClick={() => void handlePlan()}
                />
                <InventarioPrimaryButton
                  theme={theme}
                  size="md"
                  variant="ghost"
                  label="Editar"
                  icon={<Pencil size={16} aria-hidden />}
                  onClick={() => setEditing(true)}
                />
              </>
            )}
          </div>
        }
      />

      <div className={styles.detailSummary}>
        <div className={styles.detailSummaryMain}>
          <StatusBadge
            status={orderStatusToBadge(order.status)}
            variant="pill"
            size="md"
            theme={theme}
          />
          <p className={styles.detailMeta}>
            {formatOrderStatus(order.status)} · {order.batchCount} lote(s) · {order.plannedQuantity}{' '}
            {order.unit} planificados
          </p>
          <p className={styles.detailMeta}>
            {formatShift(order.shift)} · {formatPriority(order.priority)} · Inicio{' '}
            {formatPlannedDate(order.plannedStartAt)} · Fin {formatPlannedDate(order.plannedEndAt)}
          </p>
        </div>
        <RecetaProgressIndicator
          className={styles.detailPhaseProgress}
          theme={theme}
          size="md"
          value={completed}
          max={total || 1}
          variant={phaseProgressVariant(completed, total)}
          label={`${completed}/${total} fases`}
        />
      </div>

      {editing && form && (
        <section className={styles.detailEditSection} aria-label="Editar orden">
          <h2 className={styles.detailSectionTitle}>Editar borrador</h2>
          <div className={styles.modalFormGrid}>
            <InventarioFormField theme={theme} size="md" label="Receta" inputType="input">
              <input
                className={styles.input}
                type="text"
                value={`${order.recipeName} (v${order.recipeVersion})`}
                disabled
                aria-label="Receta"
              />
            </InventarioFormField>

            <InventarioFormField theme={theme} size="md" label="Número de lotes" inputType="input">
              <input
                className={styles.input}
                type="number"
                min={1}
                step={1}
                value={form.batchCount}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, batchCount: e.target.value } : prev))
                }
                aria-label="Número de lotes"
              />
            </InventarioFormField>

            <InventarioFormField
              theme={theme}
              size="md"
              label="Turno"
              inputType="select"
              bareControl
            >
              <InventarioSelect
                theme={theme}
                size="md"
                value={form.shift}
                onChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, shift: value as ProductionShift } : prev))
                }
                options={SHIFT_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                aria-label="Turno"
              />
            </InventarioFormField>

            <InventarioFormField
              theme={theme}
              size="md"
              label="Prioridad"
              inputType="select"
              bareControl
            >
              <InventarioSelect
                theme={theme}
                size="md"
                value={form.priority}
                onChange={(value) =>
                  setForm((prev) =>
                    prev ? { ...prev, priority: value as ProductionPriority } : prev,
                  )
                }
                options={PRIORITY_FORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                aria-label="Prioridad"
              />
            </InventarioFormField>

            <InventarioFormField
              theme={theme}
              size="md"
              label="Inicio planificado"
              inputType="input"
              htmlFor="edit-op-start"
            >
              <InventarioDateTimeField
                id="edit-op-start"
                theme={theme}
                size="md"
                value={form.plannedStartAt}
                onChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, plannedStartAt: value } : prev))
                }
                aria-label="Inicio planificado"
              />
            </InventarioFormField>

            <InventarioFormField
              theme={theme}
              size="md"
              label="Fin planificado"
              inputType="input"
              htmlFor="edit-op-end"
            >
              <InventarioDateTimeField
                id="edit-op-end"
                theme={theme}
                size="md"
                value={form.plannedEndAt}
                onChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, plannedEndAt: value } : prev))
                }
                aria-label="Fin planificado"
              />
            </InventarioFormField>

            {plannedQuantityPreview && (
              <div className={[styles.formGridWide, styles.hint].join(' ')}>
                <p>Cantidad total planificada: {plannedQuantityPreview}</p>
              </div>
            )}
          </div>

          <InventarioFormActions
            theme={theme}
            size="md"
            onCancel={() => setEditing(false)}
            onSave={() => void handleSave()}
            saveLabel="Guardar cambios"
            saveAccent="orange"
            saveLoading={updateMutation.isPending}
          />
        </section>
      )}

      {order.notes && !editing && (
        <p className={styles.hint}>
          <strong>Observaciones:</strong> {order.notes}
        </p>
      )}

      <ProductionOrderDocumentPanel order={order} />
    </div>
  );
}
