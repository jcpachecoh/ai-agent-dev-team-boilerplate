import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeProductionCommittee,
  createProductionCommittee,
  downloadProductionOrderPdf,
  fetchOperationsAdminUsers,
  fetchProductionCommittees,
} from './produccion.api';
import { plantFetch, plantFetchBlob } from '@/api/plant/client';

vi.mock('@/api/plant/client', () => ({
  plantFetch: vi.fn(),
  plantFetchBlob: vi.fn(),
}));

const triggerBrowserDownloadMock = vi.fn();

vi.mock('../utils/download', () => ({
  triggerBrowserDownload: (...args: unknown[]) => triggerBrowserDownloadMock(...args),
}));

describe('production committees API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchProductionCommittees builds status query', async () => {
    vi.mocked(plantFetch).mockResolvedValue([]);
    await fetchProductionCommittees({ status: 'ACTIVE' });
    expect(plantFetch).toHaveBeenCalledWith('/plant/committees?status=ACTIVE');
  });

  it('createProductionCommittee posts member ids', async () => {
    vi.mocked(plantFetch).mockResolvedValue({ id: 'c1', number: 'OP0001' });
    await createProductionCommittee({
      memberUserIds: ['user-1'],
      status: 'ACTIVE',
    });
    expect(plantFetch).toHaveBeenCalledWith('/plant/committees', {
      method: 'POST',
      body: JSON.stringify({ memberUserIds: ['user-1'], status: 'ACTIVE' }),
    });
  });

  it('closeProductionCommittee posts to close endpoint', async () => {
    vi.mocked(plantFetch).mockResolvedValue({ id: 'c1', status: 'CLOSED' });
    await closeProductionCommittee('c1');
    expect(plantFetch).toHaveBeenCalledWith('/plant/committees/c1/close', {
      method: 'POST',
    });
  });

  it('fetchOperationsAdminUsers calls eligible-members endpoint', async () => {
    vi.mocked(plantFetch).mockResolvedValue([]);
    await fetchOperationsAdminUsers();
    expect(plantFetch).toHaveBeenCalledWith('/plant/committees/eligible-members');
  });
});

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
