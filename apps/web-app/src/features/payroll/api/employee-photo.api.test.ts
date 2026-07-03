import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmployeePhotoApiError,
  uploadEmployeePhoto,
  validateEmployeePhotoFile,
} from './employee-photo.api';

vi.mock('@/lib/auth-token', () => ({ getGraphqlAuthToken: () => 'test-token' }));
vi.mock('@/lib/tenant', () => ({ getTenantId: () => 'palos-de-lena' }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('validateEmployeePhotoFile', () => {
  it('acepta imagen jpeg válida bajo 2 MB', () => {
    const file = new File(['x'.repeat(100)], 'foto.jpg', { type: 'image/jpeg' });
    expect(validateEmployeePhotoFile(file)).toBeNull();
  });

  it('acepta imagen png válida bajo 2 MB', () => {
    const file = new File(['x'.repeat(100)], 'foto.png', { type: 'image/png' });
    expect(validateEmployeePhotoFile(file)).toBeNull();
  });

  it('acepta imagen webp válida bajo 2 MB', () => {
    const file = new File(['x'.repeat(100)], 'foto.webp', { type: 'image/webp' });
    expect(validateEmployeePhotoFile(file)).toBeNull();
  });

  it('rechaza tipo de archivo no permitido', () => {
    const file = new File(['x'], 'foto.gif', { type: 'image/gif' });
    expect(validateEmployeePhotoFile(file)).toMatch(/JPG, PNG o WebP/);
  });

  it('rechaza archivos mayores a 2 MB', () => {
    const bigFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'foto.jpg', {
      type: 'image/jpeg',
    });
    expect(validateEmployeePhotoFile(bigFile)).toMatch(/2 MB/);
  });
});

describe('uploadEmployeePhoto', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('llama al endpoint correcto con FormData y retorna resultado', async () => {
    // Arrange
    const mockResult = {
      id: 'storage-1',
      publicUrl: 'https://cdn.opssynk.com/tenants/t1/users/photo.webp',
      originalName: 'foto.jpg',
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

    // Act
    const result = await uploadEmployeePhoto('emp-details-1', file);

    // Assert
    expect(result).toEqual(mockResult);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/storage/upload');
    expect(options.method).toBe('POST');
    const body = options.body as FormData;
    expect(body.get('domain')).toBe('USERS');
    expect(body.get('imageProfile')).toBe('AVATAR');
    expect(body.get('entityType')).toBe('EmployeeDetails');
    expect(body.get('entityId')).toBe('emp-details-1');
    expect(body.get('visibility')).toBe('PUBLIC');
  });

  it('lanza EmployeePhotoApiError cuando la respuesta es un error HTTP', async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Unsupported Media Type' }),
    });

    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

    // Act & Assert
    await expect(uploadEmployeePhoto('emp-details-1', file)).rejects.toBeInstanceOf(
      EmployeePhotoApiError,
    );
  });

  it('lanza EmployeePhotoApiError cuando publicUrl está vacío en la respuesta', async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'storage-1', publicUrl: null, originalName: 'foto.jpg' }),
    });

    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

    // Act & Assert
    await expect(uploadEmployeePhoto('emp-details-1', file)).rejects.toBeInstanceOf(
      EmployeePhotoApiError,
    );
  });
});
