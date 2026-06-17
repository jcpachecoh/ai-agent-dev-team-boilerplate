import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantRepository } from '../repository/tenant.repository';

const prismaMock = {
  tenant: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const baseTenant = {
  id: 'palos-de-lena',
  name: 'Palos de Leña',
  nit: '900000000-1',
  legalName: 'Palos de Leña S.A.S.',
  tradeName: 'Palos de Leña',
  legalRepresentativeName: 'Representante Legal',
  legalRepresentativeDocumentType: 'CC',
  legalRepresentativeDocumentNumber: '1000000000',
  email: 'admin@palosdelena.test',
  phone: '+57 300 000 0000',
  address: 'Dirección de prueba',
  city: 'Bogotá',
  department: 'Cundinamarca',
  country: 'CO',
  taxRegime: 'RESPONSABLE_IVA',
  logoUrl: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-14T00:00:00.000Z'),
  deletedAt: null,
};

describe('TenantRepository', () => {
  let repository: TenantRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<TenantRepository>(TenantRepository);
    jest.clearAllMocks();
  });

  it('findById filters by id and deletedAt null', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue(baseTenant);

    const result = await repository.findById('palos-de-lena');

    expect(prismaMock.tenant.findFirst).toHaveBeenCalledWith({
      where: { id: 'palos-de-lena', deletedAt: null },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'palos-de-lena',
        legalName: 'Palos de Leña S.A.S.',
      }),
    );
  });

  it('findAll filters deletedAt null', async () => {
    prismaMock.tenant.findMany.mockResolvedValue([baseTenant]);

    const result = await repository.findAll();

    expect(prismaMock.tenant.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    expect(result).toHaveLength(1);
  });

  it('update returns null when tenant does not exist', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue(null);

    const result = await repository.update('missing', { tradeName: 'Nuevo nombre' });

    expect(result).toBeNull();
    expect(prismaMock.tenant.update).not.toHaveBeenCalled();
  });

  it('update persists editable fields', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue(baseTenant);
    prismaMock.tenant.update.mockResolvedValue({
      ...baseTenant,
      tradeName: 'Nuevo nombre',
    });

    const result = await repository.update('palos-de-lena', {
      tradeName: 'Nuevo nombre',
      nit: '900000000-1',
      address: 'Nueva dirección',
      phone: '+57 301 000 0000',
      email: 'nuevo@palosdelena.test',
    });

    expect(prismaMock.tenant.update).toHaveBeenCalledWith({
      where: { id: 'palos-de-lena' },
      data: {
        tradeName: 'Nuevo nombre',
        nit: '900000000-1',
        address: 'Nueva dirección',
        phone: '+57 301 000 0000',
        email: 'nuevo@palosdelena.test',
      },
    });
    expect(result?.tradeName).toBe('Nuevo nombre');
  });
});
