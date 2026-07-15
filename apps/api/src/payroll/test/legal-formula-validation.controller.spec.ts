import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LegalFormulaValidationController } from '../controller/legal-formula-validation.controller';
import { LegalFormulaValidationService } from '../service/legal-formula-validation.service';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

interface MockLegalFormulaValidationService {
  validate: jest.Mock;
  listByTenant: jest.Mock;
  findActive: jest.Mock;
}

describe('LegalFormulaValidationController', (): void => {
  let controller: LegalFormulaValidationController;
  let mockService: MockLegalFormulaValidationService;
  const mockUser = makeJwtUser();
  const mockTenantId = 'tenant-1';

  beforeEach(async (): Promise<void> => {
    mockService = {
      validate: jest.fn(),
      listByTenant: jest.fn(),
      findActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalFormulaValidationController],
      providers: [{ provide: LegalFormulaValidationService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: (): boolean => true })
      .compile();

    controller = module.get<LegalFormulaValidationController>(LegalFormulaValidationController);
  });

  it('validate delega validatedBy=user.sub y validatedAt=ahora', async (): Promise<void> => {
    mockService.validate.mockResolvedValue({ id: 'validation-1' });

    await controller.validate(mockUser, mockTenantId, {
      formulaVersion: 1,
      legalReference: 'Concepto Jurídico 001-2026',
    });

    expect(mockService.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: mockTenantId,
        formulaVersion: 1,
        validatedBy: 'user-1',
        validatedAt: expect.any(Date),
      }),
    );
  });

  it('list delega al servicio', async (): Promise<void> => {
    mockService.listByTenant.mockResolvedValue([]);

    await controller.list(mockUser, mockTenantId);

    expect(mockService.listByTenant).toHaveBeenCalledWith(mockTenantId);
  });

  it('findActive convierte formulaVersion a número', async (): Promise<void> => {
    mockService.findActive.mockResolvedValue(null);

    await controller.findActive(mockUser, mockTenantId, '2');

    expect(mockService.findActive).toHaveBeenCalledWith(mockTenantId, 2);
  });

  describe('permisos granulares (@RequirePermission)', (): void => {
    // Indexar el prototipo a través de un tipo function-record (no `any`) evita tanto
    // no-unsafe-* como @typescript-eslint/unbound-method — Reflect.getMetadata solo lee
    // metadata de la función, nunca la invoca, así que perder el `this` no aplica aquí.
    const controllerProto = LegalFormulaValidationController.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;

    function permissionsOf(methodName: string): string[] | undefined {
      return Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, controllerProto[methodName]) as
        | string[]
        | undefined;
    }

    it('validate requiere nomina.settlement.validate_legal_formula', (): void => {
      expect(permissionsOf('validate')).toEqual(['nomina.settlement.validate_legal_formula']);
    });

    it('list y findActive requieren nomina.settlement.read', (): void => {
      expect(permissionsOf('list')).toEqual(['nomina.settlement.read']);
      expect(permissionsOf('findActive')).toEqual(['nomina.settlement.read']);
    });
  });
});
