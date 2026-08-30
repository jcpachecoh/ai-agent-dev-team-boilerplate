import {
  ArlRiskLevel,
  BeneficiaryDisabilityType,
  CostCenter,
  EmployeeContractType,
  EmployeeRelationshipType,
  LaborClassification,
  SalaryType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { toEmployeeResponse } from '../mapper/employees.mapper';

const baseEmployee = {
  id: 'emp-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana García',
  locationId: 'loc-1',
  positionId: null,
  position: 'Administradora',
  area: 'Operaciones',
  department: 'Planeación',
  contractType: EmployeeContractType.INDEFINIDO,
  hireDate: new Date('2025-01-01'),
  contractStart: new Date('2025-01-01'),
  contractEnd: null,
  salaryType: SalaryType.ORDINARIO,
  salaryAmount: new Decimal(2000000),
  hasTransportSubsidy: false,
  isExemptFromTax: false,
  epsName: 'Sura',
  pensionFundName: 'Protección',
  cesantiasFundName: 'Protección',
  arlName: 'Sura',
  arlRiskLevel: ArlRiskLevel.RIESGO_I,
  cajaCompensacion: 'Comfama',
  photoStorageObjectId: null,
  barrio: null,
  localidad: null,
  costCenter: CostCenter.OPERACIONES,
  laborClassification: LaborClassification.ADMINISTRATIVO,
  nonSalaryAmount: null,
  pinHash: null,
  portalWorkerEnabled: false,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
} as const;

describe('toEmployeeResponse', () => {
  const originalPublicDomain = process.env.R2_PUBLIC_DOMAIN;

  afterEach(() => {
    process.env.R2_PUBLIC_DOMAIN = originalPublicDomain;
  });

  it('mapea un empleado mínimo sin relaciones opcionales', () => {
    const result = toEmployeeResponse({ ...baseEmployee });

    expect(result.user).toBeUndefined();
    expect(result.location).toBeUndefined();
    expect(result.beneficiaries).toBeUndefined();
    expect(result.photoUrl).toBeNull();
    expect(result.positionId).toBeUndefined();
    expect(result.salaryAmount).toBe('2000000');
    expect(result.nonSalaryAmount).toBeUndefined();
  });

  it('mapea usuario, sede y beneficiarios cuando están presentes', () => {
    process.env.R2_PUBLIC_DOMAIN = 'cdn.restopsiq.com';

    const result = toEmployeeResponse({
      ...baseEmployee,
      nonSalaryAmount: { toString: () => '50000' } as never,
      user: {
        email: 'ana@test.com',
        cedula: '123456',
        documentType: 'CC',
        roleId: 'role-1',
      } as never,
      location: { id: 'loc-1', name: 'Sede Principal' },
      photoStorageObject: { key: 'photos/ana.jpg' } as never,
      socialProfiles: [
        {
          id: 'prof-1',
          fullName: 'Sofia Mendoza',
          primerNombre: 'Sofia',
          segundoNombre: null,
          primerApellido: 'Mendoza',
          segundoApellido: null,
          documentType: null,
          documentNumber: null,
          relationshipType: EmployeeRelationshipType.CHILD,
          disability: BeneficiaryDisabilityType.NOT_APPLICABLE,
          birthDate: new Date('2019-05-10'),
        } as never,
      ],
    });

    expect(result.user).toEqual({
      email: 'ana@test.com',
      cedula: '123456',
      documentType: 'CC',
      roleId: 'role-1',
    });
    expect(result.location).toEqual({ id: 'loc-1', name: 'Sede Principal' });
    expect(result.photoUrl).toBe('https://cdn.restopsiq.com/photos/ana.jpg');
    expect(result.nonSalaryAmount).toBe('50000');
    expect(result.beneficiaries).toEqual([
      expect.objectContaining({
        id: 'prof-1',
        fullName: 'Sofia Mendoza',
        relationshipType: EmployeeRelationshipType.CHILD,
        age: expect.any(Number),
      }),
    ]);
  });

  it('no antepone https:// si R2_PUBLIC_DOMAIN ya incluye el protocolo', () => {
    process.env.R2_PUBLIC_DOMAIN = 'http://cdn.local';

    const result = toEmployeeResponse({
      ...baseEmployee,
      photoStorageObject: { key: 'photos/ana.jpg' } as never,
    });

    expect(result.photoUrl).toBe('http://cdn.local/photos/ana.jpg');
  });

  it('retorna dominio vacío cuando R2_PUBLIC_DOMAIN no está configurado', () => {
    delete process.env.R2_PUBLIC_DOMAIN;

    const result = toEmployeeResponse({
      ...baseEmployee,
      photoStorageObject: { key: 'photos/ana.jpg' } as never,
    });

    expect(result.photoUrl).toBe('/photos/ana.jpg');
  });
});
