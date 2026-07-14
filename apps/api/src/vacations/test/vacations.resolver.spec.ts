import { Test, type TestingModule } from '@nestjs/testing';
import { VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import type { GqlRequestContext } from '../../common/graphql/tenant-from-context';
import { VacationsResolver } from '../resolver/vacations.resolver';
import { VacationsService } from '../service/vacations.service';

const TENANT_ID = 'palos-de-lena';
const USER_ID = 'user-001';
const EMPLOYEE_ID = 'emp-001';
const REQUEST_ID = 'req-001';

function makeUser(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: USER_ID,
    email: 'empleado@palos-de-lena.dev',
    tenantId: TENANT_ID,
    roleId: 'role-operator',
    roleCode: 'OPERATOR',
    ...overrides,
  };
}

const emptyContext: GqlRequestContext = {
  req: { headers: { 'x-tenant-id': TENANT_ID } },
};

const balanceRecord = {
  id: 'bal-1',
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  accruedDays: new Decimal(15),
  takenDays: new Decimal(0),
  compensatedDays: new Decimal(0),
  lastAccrualDate: new Date('2026-06-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const requestRecord = {
  id: REQUEST_ID,
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-10T00:00:00.000Z'),
  daysRequested: new Decimal(6),
  type: VacationType.DISFRUTE,
  status: VacationStatus.SOLICITADA,
  level1ApprovedBy: null,
  level1ActedAt: null,
  level2ApprovedBy: null,
  level2ActedAt: null,
  rejectionReason: null,
  letterStorageObjectId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VacationsResolver', () => {
  let resolver: VacationsResolver;
  let service: jest.Mocked<VacationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationsResolver,
        {
          provide: VacationsService,
          useValue: {
            getMyBalance: jest.fn(),
            getBalance: jest.fn(),
            assertCanViewEmployee: jest.fn(),
            listMyRequests: jest.fn(),
            listRequests: jest.fn(),
            getLetterUrl: jest.fn(),
            requestVacation: jest.fn(),
            approveLevel1: jest.fn(),
            approveLevel2: jest.fn(),
            reject: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(VacationsResolver);
    service = module.get(VacationsService);
  });

  it('delegates myVacationBalance al servicio', async () => {
    service.getMyBalance.mockResolvedValue(balanceRecord);

    const result = await resolver.myVacationBalance(makeUser(), emptyContext);

    expect(service.getMyBalance).toHaveBeenCalledWith(TENANT_ID, USER_ID);
    expect(result.availableDays).toBe(15);
    expect(result.employeeId).toBe(EMPLOYEE_ID);
  });

  it('delegates myRequestVacation resolviendo employeeId del JWT', async () => {
    service.getMyBalance.mockResolvedValue(balanceRecord);
    service.requestVacation.mockResolvedValue(requestRecord);

    const result = await resolver.myRequestVacation(makeUser(), emptyContext, {
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      type: VacationType.DISFRUTE,
    });

    expect(service.requestVacation).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      expect.objectContaining({
        employeeId: EMPLOYEE_ID,
        type: VacationType.DISFRUTE,
      }),
    );
    expect(result.status).toBe(VacationStatus.SOLICITADA);
  });

  it('delegates vacationLetterUrl al servicio', async () => {
    service.getLetterUrl.mockResolvedValue('https://storage.example/letter.pdf');

    const result = await resolver.vacationLetterUrl(makeUser(), emptyContext, REQUEST_ID);

    expect(service.getLetterUrl).toHaveBeenCalledWith(TENANT_ID, USER_ID, REQUEST_ID);
    expect(result.url).toBe('https://storage.example/letter.pdf');
  });
});
