import { useMutation } from '@tanstack/react-query';

import { downloadProductionOrderPdf } from '../api/produccion.api';

export function useDownloadProductionOrderPdf() {
  return useMutation({
    mutationFn: (orderId: string) => downloadProductionOrderPdf(orderId),
  });
}
