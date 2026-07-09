import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { getErrorMessage } from '@/lib/graphql-client';
import { useTheme } from '@/providers/ThemeProvider';

import { useRegisterDotacionMutation } from '../hooks/useDotacionesMutations';
import { useAvailableItemsForDotacionQuery } from '../hooks/useDotacionesQuery';
import type { DotacionDelivery } from '../types/dotaciones.types';
import styles from './RegisterDotacionModal.module.scss';

function todayIso(): string {
  return new Date().toISOString().split('T')[0]!;
}

const schema = z.object({
  supplyItemId: z.string().min(1, 'Selecciona un ítem de dotación'),
  quantity: z.number().int().min(1, 'Mínimo 1 unidad'),
  deliveredAt: z.string().min(1, 'Fecha de entrega requerida'),
  signedReceiptUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith('http'), { message: 'URL inválida' }),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  delivery: DotacionDelivery;
  period: string;
  locationId?: string;
  onClose: () => void;
}

export function RegisterDotacionModal({
  delivery,
  period,
  locationId,
  onClose,
}: Props): React.JSX.Element {
  const { theme } = useTheme();
  const modalTheme = theme === 'light' ? 'light' : 'dark';

  const itemsQuery = useAvailableItemsForDotacionQuery();
  const registerMutation = useRegisterDotacionMutation(period, locationId);

  const items = itemsQuery.data ?? [];

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${item.nombre}${item.talla ? ` · Talla ${item.talla}` : ''} — Stock: ${item.stockActualBodega}`,
      })),
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
    defaultValues: {
      supplyItemId: '',
      quantity: 1,
      deliveredAt: todayIso(),
      signedReceiptUrl: '',
    },
  });

  useEffect(() => {
    reset({
      supplyItemId: '',
      quantity: 1,
      deliveredAt: todayIso(),
      signedReceiptUrl: '',
    });
  }, [delivery.id, reset]);

  const selectedItemId = watch('supplyItemId');
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const maxStock = selectedItem ? Number(selectedItem.stockActualBodega) : undefined;
  const stockLow = maxStock !== undefined && maxStock <= 3;

  const busy = registerMutation.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      await registerMutation.mutateAsync({
        dotacionDeliveryId: delivery.id,
        supplyItemId: values.supplyItemId,
        quantity: values.quantity,
        deliveredAt: values.deliveredAt,
        signedReceiptUrl: values.signedReceiptUrl || undefined,
      });
      toast.success('Entrega de dotación registrada');
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
      title="Registrar entrega de dotación"
      description={`Período ${period} · Empleado ${delivery.employeeId}`}
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
            {busy ? 'Guardando…' : 'Registrar entrega'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Ítem de dotación</span>
          <Controller
            name="supplyItemId"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Ítem de dotación"
                options={[{ value: '', label: 'Seleccionar ítem…' }, ...itemOptions]}
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
            <p className={`${styles.stockHint}${stockLow ? ` ${styles.stockLow}` : ''}`}>
              Stock disponible: {selectedItem.stockActualBodega} {selectedItem.unidadBase}
              {stockLow ? ' ⚠ stock bajo' : ''}
            </p>
          ) : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Cantidad</span>
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

        <label className={styles.field}>
          <span className={styles.label}>URL comprobante firmado (opcional)</span>
          <input
            className={styles.input}
            type="url"
            placeholder="https://drive.google.com/..."
            autoComplete="off"
            {...register('signedReceiptUrl')}
          />
          {errors.signedReceiptUrl ? (
            <p className={styles.error}>{errors.signedReceiptUrl.message}</p>
          ) : null}
        </label>
      </div>
    </Modal>
  );
}
