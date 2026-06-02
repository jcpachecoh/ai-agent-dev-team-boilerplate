import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SupplierService } from '../service/supplier.service';
import { SupplierRepository } from '../repository/supplier.repository';
import type { Supplier } from '@prisma/client';

const mockSupplier: Supplier = {
  id: 'sup-1',
  tenantId: 'tenant-1',
  razonSocial: 'Test Supplier',
  nit: '123456789',
  dv: null,
  tipo: 'PERSONA_JURIDICA' as any,
  direccion: null,
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

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: jest.Mocked<SupplierRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: SupplierRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            search: jest.fn(),
            create: jest.fn(),
            findByNit: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            countProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    repository = module.get(SupplierRepository);
  });

  afterEach(() => jest.resetAllMocks());

  describe('findById', () => {
    it('returns supplier when found', async () => {
      repository.findById.mockResolvedValue(mockSupplier);
      const result = await service.findById('sup-1', 'tenant-1');
      expect(result.id).toBe('sup-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const validInput = {
      razonSocial: 'Test Supplier',
      nit: '123456789',
      tipo: 'PERSONA_JURIDICA',
      condicionPago: 'CONTADO',
    };

    it('creates supplier when NIT is unique', async () => {
      repository.findByNit.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockSupplier);
      const result = await service.create('tenant-1', validInput);
      expect(result.id).toBe('sup-1');
    });

    it('throws ConflictException when NIT already exists', async () => {
      repository.findByNit.mockResolvedValue(mockSupplier);
      await expect(service.create('tenant-1', validInput)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('soft-deletes and returns true', async () => {
      repository.findById.mockResolvedValue(mockSupplier);
      repository.softDelete.mockResolvedValue(undefined);
      const result = await service.delete('sup-1', 'tenant-1');
      expect(result).toBe(true);
    });

    it('throws NotFoundException for missing supplier', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.delete('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
