import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayrollApiError } from './payroll.client';
import {
  createEmployeePosition,
  deactivateEmployeePosition,
  listEmployeePositions,
  updateEmployeePosition,
} from './employee-positions.api';

describe('employee-positions.api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists employee positions', async () => {
    const mockResponse = [
      {
        id: 'pos-1',
        title: 'Contador',
        area: 'Finanzas',
        baseSalaryRange: 4500000,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await listEmployeePositions({ includeInactive: false });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employee-positions?includeInactive=false'),
      expect.any(Object),
    );
  });

  it('creates employee position', async () => {
    const payload = { title: 'Contador', area: 'Finanzas', baseSalaryRange: 4500000 };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'pos-1', ...payload, isActive: true }),
    } as Response);

    await createEmployeePosition(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employee-positions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates employee position', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'pos-1' }),
    } as Response);

    await updateEmployeePosition('pos-1', { title: 'Analista' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employee-positions/pos-1'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('deactivates employee position', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'pos-1', isActive: false }),
    } as Response);

    await deactivateEmployeePosition('pos-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employee-positions/pos-1/deactivate'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('throws PayrollApiError on failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => 'Conflict',
      statusText: 'Conflict',
    } as Response);

    await expect(listEmployeePositions()).rejects.toBeInstanceOf(PayrollApiError);
  });
});
