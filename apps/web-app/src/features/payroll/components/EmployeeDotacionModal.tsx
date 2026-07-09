import { Button, Modal, RecetaFilterSelect, toast } from '@restopsiq/ui';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { getErrorMessage } from '@/lib/graphql-client';

import {
  useCreateDotacionForEmployeeMutation,
  useEmployeeDotacionRegisterMutation,
  useUpdateDotacionMutation,
} from '../hooks/useDotacionesMutations';
import {
  useAvailableItemsForDotacionQuery,
  useEmployeeDotacionHistoryQuery,
} from '../hooks/useDotacionesQuery';
import { DOTACION_STATUS_LABELS } from '../types/dotaciones.types';
import type { DotacionDelivery } from '../types/dotaciones.types';
import styles from './EmployeeDotacionModal.module.scss';

function todayIso(): string {
  return new Date().toISOString().split('T')[0]!;
}

const registerSchema = z.object({
  supplyItemId: z.string().min(1, 'Selecciona un ítem'),
  quantity: z.number().int().min(1, 'Mínimo 1'),
  deliveredAt: z.string().min(1, 'Fecha requerida'),
  signedReceiptUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith('http'), { message: 'URL inválida' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const editSchema = z.object({
  deliveredAt: z.string().min(1, 'Fecha requerida'),
  signedReceiptUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith('http'), { message: 'URL inválida' }),
});

type EditFormValues = z.infer<typeof editSchema>;

interface Props {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

function StatusBadge({ status }: { status: DotacionDelivery['status'] }) {
  const cls =
    status === 'ENTREGADA'
      ? styles.badgeEntregada
      : status === 'NO_APLICA'
        ? styles.badgeNoAplica
        : styles.badgePendiente;
  return <span className={`${styles.badge} ${cls}`}>{DOTACION_STATUS_LABELS[status]}</span>;
}

// ── Pending row ───────────────────────────────────────────────────────────────

function PendingDeliveryRow({
  delivery,
  employeeId,
  theme,
}: {
  delivery: DotacionDelivery;
  employeeId: string;
  theme: 'light' | 'dark';
}) {
  const itemsQuery = useAvailableItemsForDotacionQuery();
  const registerMutation = useEmployeeDotacionRegisterMutation(employeeId);
  const items = itemsQuery.data ?? [];

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${item.nombre}${item.talla ? ` · T${item.talla}` : ''} — Stock: ${item.stockActualBodega}`,
      })),
    [items],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { supplyItemId: '', quantity: 1, deliveredAt: todayIso(), signedReceiptUrl: '' },
  });

  const selectedItemId = watch('supplyItemId');
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const maxStock = selectedItem ? Number(selectedItem.stockActualBodega) : undefined;
  const stockLow = maxStock !== undefined && maxStock <= 3;
  const busy = registerMutation.isPending;

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        dotacionDeliveryId: delivery.id,
        supplyItemId: values.supplyItemId,
        quantity: values.quantity,
        deliveredAt: values.deliveredAt,
        signedReceiptUrl: values.signedReceiptUrl || undefined,
      });
      toast.success(`Dotación ${delivery.period} registrada`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={styles.pendingRow}>
      <div className={styles.rowHeader}>
        <span className={styles.periodLabel}>{delivery.period}</span>
        <StatusBadge status="PENDIENTE" />
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Ítem de dotación</span>
          <Controller
            name="supplyItemId"
            control={control}
            render={({ field }) => (
              <RecetaFilterSelect
                aria-label="Ítem de dotación"
                options={[{ value: '', label: 'Seleccionar…' }, ...itemOptions]}
                value={field.value}
                onChange={field.onChange}
                theme={theme === 'light' ? 'light' : 'dark'}
                size="sm"
              />
            )}
          />
          {errors.supplyItemId ? (
            <p className={styles.error}>{errors.supplyItemId.message}</p>
          ) : null}
          {selectedItem ? (
            <p className={`${styles.stockHint}${stockLow ? ` ${styles.stockLow}` : ''}`}>
              Stock: {selectedItem.stockActualBodega} {selectedItem.unidadBase}
              {stockLow ? ' ⚠' : ''}
            </p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Cant.</span>
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
          <span className={styles.label}>Fecha entrega</span>
          <input
            className={styles.input}
            type="date"
            max={todayIso()}
            {...register('deliveredAt')}
          />
          {errors.deliveredAt ? <p className={styles.error}>{errors.deliveredAt.message}</p> : null}
        </label>
      </div>

      <div className={styles.receiptRow}>
        <label className={styles.field} style={undefined}>
          <span className={styles.label}>URL comprobante (opcional)</span>
          <input
            className={styles.input}
            type="url"
            placeholder="https://..."
            {...register('signedReceiptUrl')}
          />
          {errors.signedReceiptUrl ? (
            <p className={styles.error}>{errors.signedReceiptUrl.message}</p>
          ) : null}
        </label>
        <button
          type="button"
          className={styles.btnRegister}
          disabled={busy}
          onClick={() => void handleSubmit(onSubmit)()}
        >
          {busy ? 'Guardando…' : 'Registrar'}
        </button>
      </div>
    </div>
  );
}

// ── Delivered row ─────────────────────────────────────────────────────────────

function DeliveredDeliveryRow({
  delivery,
  employeeId,
}: {
  delivery: DotacionDelivery;
  employeeId: string;
}) {
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdateDotacionMutation(employeeId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      deliveredAt: delivery.deliveredAt
        ? new Date(delivery.deliveredAt).toISOString().split('T')[0]
        : todayIso(),
      signedReceiptUrl: delivery.signedReceiptUrl ?? '',
    },
  });

  const busy = updateMutation.isPending;

  const onSubmit = async (values: EditFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: delivery.id,
        input: {
          deliveredAt: values.deliveredAt,
          signedReceiptUrl: values.signedReceiptUrl || null,
        },
      });
      toast.success('Dotación actualizada');
      setEditing(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const formattedDate = delivery.deliveredAt
    ? new Date(delivery.deliveredAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <div className={styles.deliveredRow}>
      <div className={styles.rowHeader}>
        <span className={styles.periodLabel}>{delivery.period}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status="ENTREGADA" />
          <button
            type="button"
            className={styles.btnEdit}
            onClick={() => setEditing((v) => !v)}
            aria-label="Editar dotación"
            title="Editar fecha y comprobante"
          >
            <Pencil size={12} aria-hidden />
          </button>
        </div>
      </div>

      <div className={styles.deliveredInfo}>
        {delivery.supplyItem ? (
          <span className={styles.deliveredItem}>
            {delivery.supplyItem.nombre}
            {delivery.supplyItem.talla ? ` · Talla ${delivery.supplyItem.talla}` : ''}
            {' · '}Cant. {delivery.quantity}
          </span>
        ) : null}
        <span className={styles.deliveredMeta}>
          {formattedDate}
          {delivery.signedReceiptUrl ? (
            <>
              {' · '}
              <a href={delivery.signedReceiptUrl} target="_blank" rel="noopener noreferrer">
                Ver comprobante
              </a>
            </>
          ) : null}
        </span>
      </div>

      {editing ? (
        <div className={styles.editForm}>
          <label className={styles.field}>
            <span className={styles.label}>Fecha entrega</span>
            <input
              className={styles.input}
              type="date"
              max={todayIso()}
              {...register('deliveredAt')}
            />
            {errors.deliveredAt ? (
              <p className={styles.error}>{errors.deliveredAt.message}</p>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>URL comprobante</span>
            <input
              className={styles.input}
              type="url"
              placeholder="https://..."
              {...register('signedReceiptUrl')}
            />
            {errors.signedReceiptUrl ? (
              <p className={styles.error}>{errors.signedReceiptUrl.message}</p>
            ) : null}
          </label>

          <button
            type="button"
            className={styles.btnSave}
            disabled={busy}
            onClick={() => void handleSubmit(onSubmit)()}
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Add dotacion row ──────────────────────────────────────────────────────────

const PERIOD_MONTHS = ['04', '08', '12'] as const;
const PERIOD_LABELS: Record<string, string> = { '04': 'Abril', '08': 'Agosto', '12': 'Diciembre' };

function buildAvailablePeriods(): { value: string; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  return years
    .flatMap((y) => PERIOD_MONTHS.map((m) => `${y}-${m}`))
    .map((p) => ({ value: p, label: `${p.split('-')[0]} — ${PERIOD_LABELS[p.split('-')[1]!]}` }));
}

function AddDotacionRow({ employeeId }: { employeeId: string }) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const createMutation = useCreateDotacionForEmployeeMutation(employeeId);
  const available = useMemo(() => buildAvailablePeriods(), []);
  const busy = createMutation.isPending;

  const handleAdd = async () => {
    if (!selectedPeriod) return;
    try {
      await createMutation.mutateAsync(selectedPeriod);
      toast.success(`Dotación ${selectedPeriod} creada`);
      setSelectedPeriod('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className={styles.addRow}>
      <select
        className={styles.input}
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        aria-label="Período a agregar"
      >
        <option value="">Seleccionar período…</option>
        {available.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.btnRegister}
        disabled={!selectedPeriod || busy}
        onClick={() => void handleAdd()}
      >
        {busy ? 'Creando…' : 'Agregar'}
      </button>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function EmployeeDotacionModal({
  employeeId,
  employeeName,
  open,
  onClose,
  theme,
}: Props): React.JSX.Element {
  const modalTheme = theme === 'light' ? 'light' : 'dark';
  const historyQuery = useEmployeeDotacionHistoryQuery(employeeId, open);
  const deliveries = historyQuery.data?.edges ?? [];

  const pending = deliveries.filter((d) => d.status === 'PENDIENTE');
  const delivered = deliveries.filter((d) => d.status === 'ENTREGADA');
  const noAplica = deliveries.filter((d) => d.status === 'NO_APLICA');

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      size="lg"
      theme={modalTheme}
      title="Gestionar dotaciones"
      description={employeeName}
      footer={
        <Button variant="secondary" size="medium" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className={styles.body}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Agregar dotación</span>
          <AddDotacionRow employeeId={employeeId} />
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>Pendientes de registro</span>
          {pending.length === 0 ? (
            <div className={styles.empty}>Sin dotaciones pendientes</div>
          ) : (
            pending.map((d) => (
              <PendingDeliveryRow key={d.id} delivery={d} employeeId={employeeId} theme={theme} />
            ))
          )}
        </div>

        {delivered.length > 0 ? (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Entregadas</span>
            {delivered.map((d) => (
              <DeliveredDeliveryRow key={d.id} delivery={d} employeeId={employeeId} />
            ))}
          </div>
        ) : null}

        {noAplica.length > 0 ? (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>No aplica</span>
            {noAplica.map((d) => (
              <div key={d.id} className={styles.naRow}>
                <span className={styles.periodLabel}>{d.period}</span>
                <StatusBadge status="NO_APLICA" />
                {d.noAplicaReason ? (
                  <span className={styles.naReason}>{d.noAplicaReason}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
