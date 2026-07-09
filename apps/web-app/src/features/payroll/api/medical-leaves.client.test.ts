import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MedicalLeavesApiError,
  listMedicalLeaves,
  registerMedicalLeave,
  updateMedicalLeaveStatus,
  uploadMedicalLeaveSupportDocument,
  validateMedicalLeaveSupportFile,
} from './medical-leaves.client';

vi.mock('@/lib/auth-token', () => ({ getGraphqlAuthToken: () => 'test-token' }));
vi.mock('@/lib/tenant', () => ({ getTenantId: () => 'tenant-1' }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('validateMedicalLeaveSupportFile', () => {
  it('acepta PDF bajo 10 MB', () => {
    const file = new File(['%PDF'], 'soporte.pdf', { type: 'application/pdf' });
    expect(validateMedicalLeaveSupportFile(file)).toBeNull();
  });

  it('rechaza tipos no permitidos', () => {
    const file = new File(['x'], 'soporte.gif', { type: 'image/gif' });
    expect(validateMedicalLeaveSupportFile(file)).toMatch(/PDF, JPG o PNG/);
  });

  it('rechaza archivos mayores a 10 MB', () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'soporte.pdf', {
      type: 'application/pdf',
    });
    expect(validateMedicalLeaveSupportFile(file)).toMatch(/10 MB/);
  });
});

describe('medical-leaves.client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('listMedicalLeaves llama al endpoint con filtros', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await listMedicalLeaves({ month: '2026-03', locationId: 'loc-1' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/medical-leaves?');
    expect(url).toContain('month=2026-03');
    expect(url).toContain('locationId=loc-1');
  });

  it('registerMedicalLeave envía payload JSON', async () => {
    const mockDetail = {
      id: 'leave-1',
      employeeId: 'emp-1',
      origin: 'COMUN',
      annualAccumulatedDays: 5,
      exceeds180DayThreshold: false,
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDetail),
    });

    const result = await registerMedicalLeave({
      employeeId: 'emp-1',
      origin: 'COMUN',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
    });

    expect(result.id).toBe('leave-1');
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toContain('emp-1');
  });

  it('updateMedicalLeaveStatus usa PATCH', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'leave-1', status: 'RADICADA_EPS' }),
    });

    await updateMedicalLeaveStatus('leave-1', { status: 'RADICADA_EPS' });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/medical-leaves/leave-1/status');
    expect(options.method).toBe('PATCH');
  });

  it('uploadMedicalLeaveSupportDocument envía FormData', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'leave-1', supportStorageObjectId: 'storage-1' }),
    });

    const file = new File(['%PDF'], 'soporte.pdf', { type: 'application/pdf' });
    await uploadMedicalLeaveSupportDocument('leave-1', file);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('lanza MedicalLeavesApiError en respuestas HTTP fallidas', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Datos inválidos' }),
    });

    await expect(listMedicalLeaves()).rejects.toBeInstanceOf(MedicalLeavesApiError);
  });
});
