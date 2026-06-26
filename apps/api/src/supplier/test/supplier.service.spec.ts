import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Supplier } from '@prisma/client';
import { SupplierRepository } from '../repository/supplier.repository';
import { SupplierService } from '../service/supplier.service';

const tenantId = 'tenant-1';
const mockSupplier: Supplier = {
  id: 'sup-1',
  tenantId,
  razonSocial: 'Test Supplier',
  nit: '123456789',
  dv: null,
  tipo: 'PERSONA_JURIDICA' as any,
  direccion: null,
  departamento: null,
  ciudad: null,
  telefono: null,
  email: null,
  contactoNombre: null,
  condicionPago: 'CONTADO' as any,
  cupoCredito: 0,
  calificacion: 3 as any,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  findByNit: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countProducts: jest.fn(),
};

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierService, { provide: SupplierRepository, useValue: repoMock }],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    jest.clearAllMocks();
  });

  it('returns suppliers for the tenant', async () => {
    repoMock.findAll.mockResolvedValue([mockSupplier]);

    const result = await service.findAll(tenantId, { filter: 'test' });

    expect(result).toEqual([mockSupplier]);
    expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, { filter: 'test' });
  });

  it('throws NotFoundException when supplier is missing', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById('missing', tenantId)).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when NIT already exists', async () => {
    repoMock.findByNit.mockResolvedValue(mockSupplier);

    await expect(
      service.create(tenantId, {
        razonSocial: 'Test Supplier',
        nit: '123456789',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('soft deletes a supplier', async () => {
    repoMock.findById.mockResolvedValue(mockSupplier);
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.delete('sup-1', tenantId)).resolves.toBe(true);
  });

  it('searches suppliers', async () => {
    repoMock.search.mockResolvedValue([mockSupplier]);

    await expect(service.search(tenantId, 'test')).resolves.toEqual([mockSupplier]);
  });

  it('creates a supplier when NIT is unique', async () => {
    repoMock.findByNit.mockResolvedValue(null);
    repoMock.create.mockResolvedValue(mockSupplier);

    await expect(
      service.create(tenantId, {
        razonSocial: 'Test Supplier',
        nit: '987654321',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
      }),
    ).resolves.toEqual(mockSupplier);
  });

  it('updates a supplier', async () => {
    repoMock.findById.mockResolvedValue(mockSupplier);
    repoMock.update.mockResolvedValue({ ...mockSupplier, ciudad: 'Medellin' });

    await expect(service.update('sup-1', tenantId, { ciudad: 'Medellin' })).resolves.toEqual({
      ...mockSupplier,
      ciudad: 'Medellin',
    });
  });

  it('creates a supplier with departamento', async () => {
    // Arrange
    repoMock.findByNit.mockResolvedValue(null);
    repoMock.create.mockResolvedValue({
      ...mockSupplier,
      departamento: 'Antioquia',
      ciudad: 'Medellín',
    });

    // Act
    const result = await service.create(tenantId, {
      razonSocial: 'Test Supplier',
      nit: '987654321',
      tipo: 'PERSONA_JURIDICA',
      condicionPago: 'CONTADO',
      departamento: 'Antioquia',
      ciudad: 'Medellín',
    });

    // Assert
    expect(result.departamento).toBe('Antioquia');
    expect(result.ciudad).toBe('Medellín');
  });

  it('updates supplier with departamento', async () => {
    // Arrange
    repoMock.findById.mockResolvedValue(mockSupplier);
    repoMock.update.mockResolvedValue({
      ...mockSupplier,
      departamento: 'Valle del Cauca',
      ciudad: 'Cali',
    });

    // Act
    const result = await service.update('sup-1', tenantId, {
      departamento: 'Valle del Cauca',
      ciudad: 'Cali',
    });

    // Assert
    expect(result.departamento).toBe('Valle del Cauca');
    expect(result.ciudad).toBe('Cali');
  });

  it('supplier response includes departamento field', async () => {
    // Arrange
    const supplierWithDep = { ...mockSupplier, departamento: 'Bogotá D.C.', ciudad: 'Bogotá' };
    repoMock.findById.mockResolvedValue(supplierWithDep);

    // Act
    const result = await service.findById('sup-1', tenantId);

    // Assert
    expect(result).toHaveProperty('departamento', 'Bogotá D.C.');
  });
});
