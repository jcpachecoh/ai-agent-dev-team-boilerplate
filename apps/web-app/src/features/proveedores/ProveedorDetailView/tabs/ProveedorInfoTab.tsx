import { ProveedorContactPanel, ProveedorMetricsPanel } from '@restopsiq/ui';
import { useQuery } from '@tanstack/react-query';
import { useUiTheme } from '@/hooks/useUiTheme';
import { useMe } from '@/features/auth/hooks/useMe';

import { fetchSupplierLogisticsHistory } from '../../api/proveedores-logistics.queries';
import { PROVEEDOR_TABLE_SIZE } from '../../constants';
import {
  DELIVERY_DAY_OPTIONS,
  DELIVERY_MODE_OPTIONS,
  DELIVERY_PLACE_OPTIONS,
  TRANSPORT_TYPE_OPTIONS,
} from '../../constants';
import {
  formatCondicionPago,
  formatLogisticsHistoryAction,
  formatReliability,
} from '../../mappers/display';
import styles from '../../proveedores.module.scss';
import type { SupplierViewModel } from '../../types';

interface ProveedorInfoTabProps {
  supplier: SupplierViewModel;
}

function labelForOption(
  options: Array<{ value: string; label: string }>,
  value?: string | null,
): string {
  if (!value) return '—';
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function ProveedorInfoTab({ supplier }: ProveedorInfoTabProps): React.JSX.Element {
  const theme = useUiTheme();
  const meQuery = useMe();
  const logistics = supplier.logistics;
  const isAdmin = ['OWNER', 'SUPER_ADMIN'].includes(meQuery.data?.roleCode ?? '');

  const historyQuery = useQuery({
    queryKey: ['proveedores', supplier.id, 'logistics-history'],
    queryFn: () => fetchSupplierLogisticsHistory(supplier.id),
    enabled: isAdmin && Boolean(supplier.id),
  });

  const contactFields = [
    { label: 'EMAIL', value: supplier.email ?? '—' },
    { label: 'TELÉFONO', value: supplier.telefono ?? '—' },
    { label: 'DIRECCIÓN', value: supplier.direccion ?? '—' },
    { label: 'CIUDAD', value: supplier.ciudad ?? '—' },
  ];

  const metrics = [
    { label: 'CONFIABILIDAD', value: formatReliability(supplier.calificacion) },
    { label: 'LEAD TIME LOGÍSTICO', value: supplier.leadTimeLabel },
    { label: 'CONDICIÓN PAGO', value: formatCondicionPago(supplier.condicionPago) },
  ];

  const logisticsFields = logistics
    ? [
        {
          label: 'ESTADO',
          value: logistics.status === 'DRAFT' ? 'Logística incompleta' : 'Completa',
        },
        {
          label: 'MODALIDAD',
          value: labelForOption(DELIVERY_MODE_OPTIONS, logistics.deliveryMode ?? undefined),
        },
        {
          label: 'LUGAR',
          value:
            logistics.deliveryPlace === 'OTHER'
              ? logistics.deliveryPlaceCustom || 'Otro'
              : labelForOption(DELIVERY_PLACE_OPTIONS, logistics.deliveryPlace ?? undefined),
        },
        {
          label: 'DÍAS',
          value:
            logistics.deliveryDays
              .map(
                (day) => DELIVERY_DAY_OPTIONS.find((option) => option.value === day)?.label ?? day,
              )
              .join(', ') || '—',
        },
        {
          label: 'TRANSPORTE',
          value: labelForOption(TRANSPORT_TYPE_OPTIONS, logistics.transportType ?? undefined),
        },
        {
          label: 'RESPONSABLE',
          value: logistics.receptionResponsible?.email ?? '—',
        },
        {
          label: 'COBERTURA',
          value: logistics.coverageLocations.map((location) => location.name).join(', ') || '—',
        },
      ]
    : [{ label: 'ESTADO', value: 'Sin información logística' }];

  return (
    <div className={[styles.infoGrid, styles.tabPanelFlush].join(' ')}>
      <ProveedorContactPanel
        title="Datos de contacto"
        fields={contactFields}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />
      <ProveedorContactPanel
        title="Información logística"
        fields={logisticsFields}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />
      <ProveedorMetricsPanel
        title="Métricas operacionales"
        metrics={metrics}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />

      {logistics?.status === 'DRAFT' && (
        <p className={styles.logisticsWarning} role="status">
          La logística está guardada como borrador. Completa los campos obligatorios en edición.
        </p>
      )}

      {logistics?.receptionResponsibleStale && (
        <p className={styles.logisticsWarning} role="status">
          El responsable de recepción ya no está activo. Actualiza este dato en edición.
        </p>
      )}

      {isAdmin && (historyQuery.data?.length ?? 0) > 0 && (
        <section className={styles.logisticsHistory}>
          <h3>Historial logístico</h3>
          {historyQuery.data?.map((entry) => (
            <article key={entry.id} className={styles.logisticsHistoryItem}>
              <strong>{formatLogisticsHistoryAction(entry.action)}</strong> —{' '}
              {entry.actorEmail ?? 'Sistema'} — {new Date(entry.createdAt).toLocaleString('es-CO')}
              {entry.changes.length > 0 && (
                <ul>
                  {entry.changes.map((change) => (
                    <li key={`${entry.id}-${change.field}`}>
                      {change.field}: {change.oldValue ?? '—'} → {change.newValue ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
