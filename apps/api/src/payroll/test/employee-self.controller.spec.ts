import { Test, TestingModule } from '@nestjs/testing';

import { EmployeeSelfController } from '../controller/employee-self.controller';
import { PayrollService } from '../service/payroll.service';

const TENANT_ID = 'palos-de-lena';
const USER_ID = 'user-operator';

describe('EmployeeSelfController', () => {
  let controller: EmployeeSelfController;
  let payrollService: jest.Mocked<PayrollService>;

  beforeEach(async () => {
    payrollService = {
      findSelf: jest.fn(),
    } as unknown as jest.Mocked<PayrollService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeSelfController],
      providers: [{ provide: PayrollService, useValue: payrollService }],
    }).compile();

    controller = module.get(EmployeeSelfController);
  });

  it('retorna el empleado del usuario autenticado', async () => {
    payrollService.findSelf.mockResolvedValue({
      id: 'emp-1',
      userId: USER_ID,
      tenantId: TENANT_ID,
      name: 'Operario de Planta',
      locationId: 'loc-1',
      position: 'ADMINISTRADOR JUNIOR',
      user: { email: 'mes-operator@palos-de-lena.dev' },
    } as never);

    const result = await controller.findMe(
      { sub: USER_ID, tenantId: TENANT_ID, roleCode: 'OPERATOR' } as never,
      TENANT_ID,
    );

    expect(payrollService.findSelf).toHaveBeenCalledWith(TENANT_ID, USER_ID);
    expect(result.id).toBe('emp-1');
    expect(result.name).toBe('Operario de Planta');
  });
});
