import { toast } from '@restopsiq/ui';
import { useCallback, useState } from 'react';

import { PayrollApiError } from '../api/payroll.client';
import { downloadExportBlob } from '../utils/download-export-blob';
import type { PayrollReportExportFormat } from '../types/payroll-reports.types';

interface UsePayrollExportOptions<TFilters> {
  buildFilename: (format: PayrollReportExportFormat, filters: TFilters) => string;
  exportFn: (filters: TFilters, format: PayrollReportExportFormat) => Promise<Blob>;
}

export function usePayrollExport<TFilters>({
  buildFilename,
  exportFn,
}: UsePayrollExportOptions<TFilters>) {
  const [loading, setLoading] = useState(false);

  const exportReport = useCallback(
    async (filters: TFilters, format: PayrollReportExportFormat) => {
      setLoading(true);
      try {
        const blob = await exportFn(filters, format);
        downloadExportBlob(blob, buildFilename(format, filters));
        toast.success(format === 'PDF' ? 'Reporte PDF descargado' : 'Reporte Excel descargado');
      } catch (error) {
        const message =
          error instanceof PayrollApiError ? error.message : 'No se pudo exportar el reporte';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [buildFilename, exportFn],
  );

  return { loading, exportReport };
}
