import { toast } from '@restopsiq/ui';
import { useState } from 'react';

import { downloadFinalSettlementReceipt } from '../api/final-settlement.client';
import { PayrollApiError } from '../api/payroll.client';
import { downloadExportBlob } from '../utils/download-export-blob';

interface UseFinalSettlementReceiptDownloadResult {
  loading: boolean;
  downloadReceipt: (id: string) => Promise<void>;
}

/** OS-591 (fase 5) — mismo patrón de `usePayrollExport`/`useCesantiasExport`: descarga el
 * blob y dispara la descarga en el navegador vía `downloadExportBlob`. */
export function useFinalSettlementReceiptDownload(): UseFinalSettlementReceiptDownloadResult {
  const [loading, setLoading] = useState(false);

  const downloadReceipt = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const blob = await downloadFinalSettlementReceipt(id);
      downloadExportBlob(blob, `liquidacion-definitiva-${id}.pdf`);
      toast.success('Comprobante descargado');
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo descargar el comprobante';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, downloadReceipt };
}
