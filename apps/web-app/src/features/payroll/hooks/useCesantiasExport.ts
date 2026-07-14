import { toast } from '@restopsiq/ui';
import { useCallback, useState } from 'react';

import { exportCesantias } from '../api/cesantias.client';
import { PayrollApiError } from '../api/payroll.client';
import type { CesantiasExportChannel } from '../types/cesantias.types';
import { downloadExportBlob } from '../utils/download-export-blob';

const CHANNEL_LABELS: Record<CesantiasExportChannel, string> = {
  fna: 'FNA',
  'private-funds': 'fondos privados',
};

export function useCesantiasExport() {
  const [loadingChannel, setLoadingChannel] = useState<CesantiasExportChannel | null>(null);

  const exportChannel = useCallback(async (channel: CesantiasExportChannel, year: number) => {
    setLoadingChannel(channel);
    try {
      const result = await exportCesantias(channel, year);
      const filename = result.filename ?? `cesantias-${channel}-${year}.xlsx`;
      downloadExportBlob(result.blob, filename);
      toast.success(`Archivo ${CHANNEL_LABELS[channel]} descargado`);
      // Requisito funcional: nunca omitir empleados en silencio — el backend ya expone el
      // conteo en X-Cesantias-Export-Skipped-Count (ver cesantias.client.ts); esta
      // advertencia es la contraparte visible en la UI (no solo el header/log de auditoría).
      if (result.skippedCount > 0) {
        const noun = result.skippedCount === 1 ? 'liquidación' : 'liquidaciones';
        toast.warning(
          `${result.skippedCount} ${noun} no se ${result.skippedCount === 1 ? 'incluyó' : 'incluyeron'} en el archivo por falta de datos personales del empleado. Revisa el registro de auditoría para más detalle.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo exportar el archivo';
      toast.error(message);
    } finally {
      setLoadingChannel(null);
    }
  }, []);

  return { loadingChannel, exportChannel };
}
