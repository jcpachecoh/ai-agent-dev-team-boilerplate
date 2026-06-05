import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadProductionOrderPdf } from './produccion.api';
import { plantFetchBlob } from './plant.client';

vi.mock('./plant.client', () => ({
  plantFetch: vi.fn(),
  plantFetchBlob: vi.fn(),
}));

const triggerBrowserDownloadMock = vi.fn();

vi.mock('../utils/download', () => ({
  triggerBrowserDownload: (...args: unknown[]) => triggerBrowserDownloadMock(...args),
}));

describe('downloadProductionOrderPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches PDF blob and triggers browser download with Content-Disposition filename', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    vi.mocked(plantFetchBlob).mockResolvedValue({
      blob,
      filename: 'OP-2026-0134.pdf',
    });

    await downloadProductionOrderPdf('order-1');

    expect(plantFetchBlob).toHaveBeenCalledWith('/plant/orders/order-1/pdf', {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
    });
    expect(triggerBrowserDownloadMock).toHaveBeenCalledWith(blob, 'OP-2026-0134.pdf');
  });

  it('falls back to order id filename when Content-Disposition is missing', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    vi.mocked(plantFetchBlob).mockResolvedValue({ blob, filename: null });

    await downloadProductionOrderPdf('order-abc');

    expect(triggerBrowserDownloadMock).toHaveBeenCalledWith(blob, 'OP-order-abc.pdf');
  });
});
