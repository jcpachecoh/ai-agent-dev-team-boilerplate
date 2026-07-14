import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculateCesantias,
  exportCesantias,
  getCesantiasAlertSummary,
  getCesantiasExportAvailability,
  listCesantias,
} from './cesantias.client';

vi.mock('@/lib/auth-token', () => ({ getGraphqlAuthToken: () => 'test-token' }));
vi.mock('@/lib/tenant', () => ({ getTenantId: () => 'tenant-1' }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('cesantias.client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('listCesantias envía año, fondo, canal y estado como query params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], total: 0, limit: 50, offset: 0 }));

    await listCesantias({
      year: 2026,
      fundNameSnapshot: 'Porvenir',
      fundChannelSnapshot: 'PRIVATE_OPERATOR',
      cesantiasStatus: 'CALCULADA',
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/cesantias?');
    expect(url).toContain('year=2026');
    expect(url).toContain('fundNameSnapshot=Porvenir');
    expect(url).toContain('fundChannelSnapshot=PRIVATE_OPERATOR');
    expect(url).toContain('cesantiasStatus=CALCULADA');
  });

  it('calculateCesantias hace POST con el año en el body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        tenantId: 'tenant-1',
        year: 2026,
        totalEmployeesEvaluated: 0,
        created: 0,
        updated: 0,
        skipped: [],
        liquidations: [],
      }),
    );

    await calculateCesantias(2026);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/cesantias/calculate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ year: 2026 });
  });

  it('getCesantiasAlertSummary hace GET al endpoint de resumen', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        targetYear: 2025,
        deadlineDate: '2026-02-14',
        pendingCount: 0,
        daysUntilDeadline: 30,
        status: 'COMPLETADA',
      }),
    );

    await getCesantiasAlertSummary();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/cesantias/alert-summary');
  });

  it('getCesantiasExportAvailability hace GET con el año como query param', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ fna: true, privateOperator: false }));

    const result = await getCesantiasExportAvailability(2026);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/cesantias/export-availability?');
    expect(url).toContain('year=2026');
    expect(result).toEqual({ fna: true, privateOperator: false });
  });

  describe('exportCesantias', () => {
    it('lee el filename de Content-Disposition y el conteo de omitidos de X-Cesantias-Export-Skipped-Count', async () => {
      const headers = new Headers({
        'Content-Disposition': 'attachment; filename="cesantias-fna-2026.xlsx"',
        'X-Cesantias-Export-Skipped-Count': '3',
      });
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        blob: () => Promise.resolve(new Blob(['xlsx-bytes'])),
      } as unknown as Response);

      const result = await exportCesantias('fna', 2026);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/api/cesantias/export/fna');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ year: 2026 });
      expect(result.filename).toBe('cesantias-fna-2026.xlsx');
      expect(result.skippedCount).toBe(3);
    });

    it('skippedCount es 0 (no undefined/NaN) cuando el header no viene en la respuesta', async () => {
      const headers = new Headers({
        'Content-Disposition': 'attachment; filename="cesantias-fna-2026.xlsx"',
      });
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        blob: () => Promise.resolve(new Blob(['xlsx-bytes'])),
      } as unknown as Response);

      const result = await exportCesantias('fna', 2026);

      expect(result.skippedCount).toBe(0);
    });

    it('filename es null (no crashea) cuando no hay Content-Disposition', async () => {
      const headers = new Headers();
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers,
        blob: () => Promise.resolve(new Blob(['xlsx-bytes'])),
      } as unknown as Response);

      const result = await exportCesantias('private-funds', 2026);

      expect(result.filename).toBeNull();
    });
  });
});
