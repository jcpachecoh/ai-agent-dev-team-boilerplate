import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import ProductionOrderDetailView from './ProductionOrderDetailView';
import { mockProductionOrderDetail } from '../test/fixtures';

const useProductionOrderMock = vi.fn();
const usePlanProductionOrderMock = vi.fn();
const useUpdateProductionOrderMock = vi.fn();
const downloadPdfMutateAsyncMock = vi.fn();

vi.mock('../hooks/useProductionOrders', () => ({
  useProductionOrder: (...args: unknown[]) => useProductionOrderMock(...args),
  usePlanProductionOrder: () => usePlanProductionOrderMock(),
  useUpdateProductionOrder: () => useUpdateProductionOrderMock(),
}));

vi.mock('../hooks/useDownloadProductionOrderPdf', () => ({
  useDownloadProductionOrderPdf: () => ({
    mutateAsync: downloadPdfMutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock('../components/ProductionOrderDocumentPanel', () => ({
  ProductionOrderDocumentPanel: () => null,
}));

vi.mock('@restopsiq/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@restopsiq/ui')>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

function renderDetail(orderId = 'order-1'): void {
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={[`/produccion/ordenes/${orderId}`]}>
        <Routes>
          <Route path="/produccion/ordenes/:orderId" element={<ProductionOrderDetailView />} />
        </Routes>
      </MemoryRouter>
    </TestQueryProvider>,
  );
}

describe('ProductionOrderDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProductionOrderMock.mockReturnValue({
      data: mockProductionOrderDetail,
      isPending: false,
      isError: false,
      error: null,
    });
    usePlanProductionOrderMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useUpdateProductionOrderMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    downloadPdfMutateAsyncMock.mockResolvedValue(undefined);
  });

  it('renders order header', async () => {
    renderDetail();
    expect(await screen.findByText('OP 2026-0134')).toBeInTheDocument();
    expect(screen.getByText(/AJIACO BASE/)).toBeInTheDocument();
  });

  it('calls download PDF mutation when PDF button is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText('OP 2026-0134');
    await user.click(screen.getByRole('button', { name: 'PDF' }));

    expect(downloadPdfMutateAsyncMock).toHaveBeenCalledWith('order-1');
  });
});
