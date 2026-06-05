import {
  InventarioDateTimeField,
  InventarioFormField,
  InventarioModal,
  InventarioSelect,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import { PRIORITY_FORM_OPTIONS, SHIFT_FORM_OPTIONS } from '../constants';
import { useCreateProductionOrder, useProductionRecipes } from '../hooks/useProductionOrders';
import { datetimeLocalToIso, defaultPlannedWindow } from '../mappers/display';
import type { CreateProductionOrderInput, ProductionPriority, ProductionShift } from '../types';
import styles from '../produccion.module.scss';

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'No se pudo crear la orden de producción.';
}

const emptyFormState = () => {
  const { start, end } = defaultPlannedWindow();
  return {
    recipeId: '',
    batchCount: '1',
    shift: 'MORNING' as ProductionShift,
    priority: 'NORMAL' as ProductionPriority,
    plannedStartAt: start,
    plannedEndAt: end,
    notes: '',
  };
};

export interface CreateProductionOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (orderId: string) => void;
}

export function CreateProductionOrderModal({
  open,
  onClose,
  onCreated,
}: CreateProductionOrderModalProps): React.JSX.Element | null {
  const theme = useUiTheme();
  const recipesQuery = useProductionRecipes();
  const createMutation = useCreateProductionOrder();

  const [form, setForm] = useState(emptyFormState);

  useEffect(() => {
    if (open) {
      setForm(emptyFormState());
    }
  }, [open]);

  // #region agent log
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const overlay = document.querySelector('[role="presentation"]') as HTMLElement | null;
      const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
      if (!overlay || !dialog) return;
      const overlayRect = overlay.getBoundingClientRect();
      const dialogRect = dialog.getBoundingClientRect();
      fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd2ab57' },
        body: JSON.stringify({
          sessionId: 'd2ab57',
          runId: 'post-fix-modal-center',
          hypothesisId: 'H3',
          location: 'CreateProductionOrderModal.tsx:layout-probe',
          message: 'Create OP modal layout probe',
          data: {
            viewportWidth: window.innerWidth,
            overlayWidth: overlayRect.width,
            overlayLeft: overlayRect.left,
            dialogLeft: dialogRect.left,
            dialogCenterX: dialogRect.left + dialogRect.width / 2,
            viewportCenterX: window.innerWidth / 2,
            centeredDelta:
              Math.abs(dialogRect.left + dialogRect.width / 2 - window.innerWidth / 2) < 2,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    });
  }, [open]);
  // #endregion

  const recipes = recipesQuery.data ?? [];
  const selectedRecipe = recipes.find((r) => r.id === form.recipeId);

  const recipeOptions = recipes.map((r) => ({
    value: r.id,
    label: `${r.name} (v${r.version})`,
  }));

  const plannedQuantityPreview = useMemo(() => {
    if (!selectedRecipe) return null;
    const batches = Number.parseInt(form.batchCount, 10);
    if (!Number.isFinite(batches) || batches < 1) return null;
    const size = Number.parseFloat(String(selectedRecipe.batchSize));
    if (!Number.isFinite(size)) return null;
    return `${(size * batches).toFixed(3)} ${selectedRecipe.batchUnit}`;
  }, [form.batchCount, selectedRecipe]);

  const handleSave = async () => {
    const batches = Number.parseInt(form.batchCount, 10);
    if (!form.recipeId) {
      toast.error('Seleccione una receta de producción.');
      return;
    }
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

    const input: CreateProductionOrderInput = {
      recipeId: form.recipeId,
      batchCount: batches,
      shift: form.shift,
      priority: form.priority,
      plannedStartAt: startIso,
      plannedEndAt: endIso,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };

    try {
      const created = await createMutation.mutateAsync(input);
      toast.success(
        `OP ${created.number} creada con ${created.executions.length} fases en PENDING.`,
      );
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!open) return null;

  return (
    <InventarioModal
      open={open}
      theme={theme}
      size="xl"
      title="Nueva orden de producción"
      subtitle="Se generará una PhaseExecution por fase de la receta (estado PENDING). Planifique después para liberar la fase 1 en planta."
      onClose={onClose}
      onSave={() => void handleSave()}
      saveLabel={createMutation.isPending ? 'Creando…' : 'Crear orden de producción'}
      saveLoading={createMutation.isPending}
      saveDisabled={recipes.length === 0 || recipesQuery.isPending}
      saveAccent="orange"
    >
      {recipesQuery.isPending && (
        <InventoryScreenState variant="loading" message="Cargando recetas de planta…" />
      )}

      {recipesQuery.isError && (
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(recipesQuery.error)}
        </div>
      )}

      {recipesQuery.isSuccess && recipes.length === 0 && (
        <InventoryScreenState
          variant="empty"
          message="No hay recetas activas en planta. Cree recetas en el API MES antes de generar OPs."
        />
      )}

      {recipes.length > 0 && (
        <div className={styles.modalFormGrid}>
          <InventarioFormField
            theme={theme}
            size="md"
            label="Receta de producción"
            inputType="select"
            bareControl
          >
            <InventarioSelect
              theme={theme}
              size="md"
              value={form.recipeId}
              onChange={(value) => setForm((prev) => ({ ...prev, recipeId: value }))}
              options={[{ value: '', label: 'Seleccionar receta…' }, ...recipeOptions]}
              aria-label="Receta de producción"
            />
          </InventarioFormField>

          <InventarioFormField theme={theme} size="md" label="Número de lotes" inputType="input">
            <input
              className={styles.input}
              type="number"
              min={1}
              step={1}
              value={form.batchCount}
              onChange={(e) => setForm((prev) => ({ ...prev, batchCount: e.target.value }))}
              aria-label="Número de lotes"
            />
          </InventarioFormField>

          <InventarioFormField theme={theme} size="md" label="Turno" inputType="select" bareControl>
            <InventarioSelect
              theme={theme}
              size="md"
              value={form.shift}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, shift: value as ProductionShift }))
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
                setForm((prev) => ({ ...prev, priority: value as ProductionPriority }))
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
            htmlFor="op-planned-start"
          >
            <InventarioDateTimeField
              id="op-planned-start"
              theme={theme}
              size="md"
              value={form.plannedStartAt}
              onChange={(value) => setForm((prev) => ({ ...prev, plannedStartAt: value }))}
              aria-label="Inicio planificado"
            />
          </InventarioFormField>

          <InventarioFormField
            theme={theme}
            size="md"
            label="Fin planificado"
            inputType="input"
            htmlFor="op-planned-end"
          >
            <InventarioDateTimeField
              id="op-planned-end"
              theme={theme}
              size="md"
              value={form.plannedEndAt}
              onChange={(value) => setForm((prev) => ({ ...prev, plannedEndAt: value }))}
              aria-label="Fin planificado"
            />
          </InventarioFormField>

          <div className={[styles.formGridWide, styles.hint].join(' ')}>
            {plannedQuantityPreview ? (
              <p>Cantidad total planificada: {plannedQuantityPreview}</p>
            ) : (
              <p>Seleccione receta y lotes para ver la cantidad planificada.</p>
            )}
          </div>

          <InventarioFormField
            theme={theme}
            size="md"
            label="Notas (opcional)"
            inputType="input"
            className={styles.formGridWide}
          >
            <input
              className={styles.input}
              type="text"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ej. OP urgente para evento"
              aria-label="Notas"
            />
          </InventarioFormField>
        </div>
      )}
    </InventarioModal>
  );
}
