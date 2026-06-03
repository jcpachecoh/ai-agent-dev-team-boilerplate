import { ProveedorContactPanel, ProveedorMetricsPanel } from '@restopsiq/ui';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PROVEEDOR_TABLE_SIZE } from '../../constants';
import { formatCondicionPago, formatReliability } from '../../mappers/display';
import styles from '../../proveedores.module.scss';
import type { SupplierViewModel } from '../../types';

interface ProveedorInfoTabProps {
  supplier: SupplierViewModel;
}

export default function ProveedorInfoTab({ supplier }: ProveedorInfoTabProps): React.JSX.Element {
  const theme = useUiTheme();
  const contactFields = [
    { label: 'EMAIL', value: supplier.email ?? '—' },
    { label: 'TELÉFONO', value: supplier.telefono ?? '—' },
    { label: 'DIRECCIÓN', value: supplier.direccion ?? '—' },
    { label: 'CIUDAD', value: supplier.ciudad ?? '—' },
  ];

  const metrics = [
    { label: 'CONFIABILIDAD', value: formatReliability(supplier.calificacion) },
    { label: 'LEAD TIME PROMEDIO', value: supplier.leadTimeLabel },
    { label: 'CONDICIÓN PAGO', value: formatCondicionPago(supplier.condicionPago) },
  ];

  return (
    <div className={[styles.infoGrid, styles.tabPanelFlush].join(' ')}>
      <ProveedorContactPanel
        title="Datos de contacto"
        fields={contactFields}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />
      <ProveedorMetricsPanel
        title="Métricas operacionales"
        metrics={metrics}
        theme={theme}
        size={PROVEEDOR_TABLE_SIZE}
      />
    </div>
  );
}
