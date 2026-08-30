import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { getErrorMessage } from '@/lib/graphql-client';
import { useTheme } from '@/providers/ThemeProvider';

import { useBulkAssignByPositionMutation } from '../hooks/useDotacionesMutations';
import { useAvailableItemsForDotacionQuery } from '../hooks/useDotacionesQuery';
import { useEmployeePositions } from '../hooks/useEmployeePositions';
import styles from './BulkAssignByPositionModal.module.scss';

function todayIso(): string {
  return new Date().toISOString().split('T')[0]!;
}

const schema = z.object({
  positionId: z.string().min(1, 'Selecciona un cargo'),
  supplyItemId: z.string().min(1, 'Selecciona un ítem de dotación'),
  quantity: z.number().int().min(1, 'Mínimo 1 unidad'),
  deliveredAt: z.string().min(1, 'Fecha requerida'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  period: string;
  locationId?: string;
  onClose: () => void;
}

export function BulkAssignByPositionModal({
  period,
  locationId,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';

  const positionsQuery = useEmployeePositions({ includeInactive: false });
  const itemsQuery = useAvailableItemsForDotacionQuery();
  const bulkMutation = useBulkAssignByPositionMutation(period, locationId);

  const positions = positionsQuery.data ?? [];
  const items = itemsQuery.data ?? [];

  const positionOptions = useMemo(
    () => [
      { value: '', label: 'Seleccionar cargo…' },
      ...positions.map((p) => ({ value: p.id, label: `${p.title} — ${p.area}` })),
    ],
    [positions],
  );

  const itemOptions = useMemo(
    () => [
      { value: '', label: 'Seleccionar ítem…' },
      ...items.map((i) => ({
        value: i.id,
        label: `${i.nombre}${i.talla ? ` · Talla ${i.talla}` : ''} — Stock: ${i.stockActualBodega}`,
      })),
    ],
    [items],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { positionId: '', supplyItemId: '', quantity: 1, deliveredAt: todayIso() },
  });

  useEffect(() => {
    reset({ positionId: '', supplyItemId: '', quantity: 1, deliveredAt: todayIso() });
  }, [reset]);

  const selectedItemId = watch('supplyItemId');
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const maxStock = selectedItem ? Number(selectedItem.stockActualBodega) : undefined;
  const stockLow = maxStock !== undefined && maxStock <= 5;

  const busy = bulkMutation.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await bulkMutation.mutateAsync({
        period,
        positionId: values.positionId,
        supplyItemId: values.supplyItemId,
        quantity: values.quantity,
        deliveredAt: values.deliveredAt,
        locationId,
      });

      if (result.assigned === 0) {
        toast.success('No había registros pendientes para ese cargo en este período.');
      } else {
        toast.success(
          `${result.assigned} entrega${result.assigned === 1 ? '' : 's'} registrada${result.assigned === 1 ? '' : 's'} correctamente.`,
        );
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      open={true}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onClose();
      }}
      size="md"
      theme={modalTheme}
      title="Asignar dotación por cargo"
      description={`Registra entrega masiva para todos los empleados con un cargo específico — Período ${period}`}
      onInteractOutside={(event) => {
        if (busy) event.preventDefault();
      }}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={busy}
          >
            {busy ? 'Asignando…' : 'Asignar a todos'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Cargo</span>
          <Controller
            name="positionId"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Cargo"
                options={positionOptions}
                value={field.value}
                onChange={field.onChange}
                theme={modalTheme}
                size="md"
              />
            )}
          />
          {errors.positionId ? <p className={styles.error}>{errors.positionId.message}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Ítem de dotación</span>
          <Controller
            name="supplyItemId"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Ítem de dotación"
                options={itemOptions}
                value={field.value}
                onChange={field.onChange}
                theme={modalTheme}
                size="md"
              />
            )}
          />
          {errors.supplyItemId ? (
            <p className={styles.error}>{errors.supplyItemId.message}</p>
          ) : null}
          {selectedItem ? (
            <p className={`${styles.hint}${stockLow ? ` ${styles.hintWarn}` : ''}`}>
              Stock disponible: {selectedItem.stockActualBodega} {selectedItem.unidadBase}
              {stockLow ? ' ⚠ stock bajo' : ''}
            </p>
          ) : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Cantidad por empleado</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={maxStock}
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity ? <p className={styles.error}>{errors.quantity.message}</p> : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Fecha de entrega</span>
            <input
              className={styles.input}
              type="date"
              max={todayIso()}
              autoComplete="off"
              {...register('deliveredAt')}
            />
            {errors.deliveredAt ? (
              <p className={styles.error}>{errors.deliveredAt.message}</p>
            ) : null}
          </label>
        </div>

        <div className={styles.preview}>
          <span className={styles.previewCount}>
            {maxStock !== undefined ? `≤${maxStock}` : '—'}
          </span>
          <span className={styles.previewLabel}>
            Se registrará entrega a todos los empleados con ese cargo en estado{' '}
            <strong>Pendiente</strong> para el período <strong>{period}</strong>.
            {locationId ? ' Solo empleados de la sede seleccionada.' : ''}
          </span>
        </div>
      </div>
    </Modal>
  );
}
