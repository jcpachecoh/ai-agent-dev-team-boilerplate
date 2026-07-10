import { Test, type TestingModule } from '@nestjs/testing';
import { ConsentType } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import type { GqlRequestContext } from '../../common/graphql/tenant-from-context';
import { DataConsentResolver } from '../resolver/data-consent.resolver';
import { DataConsentService } from '../service/data-consent.service';

const TENANT_ID = 'palos-de-lena';
const USER_ID = 'user-001';

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
  req: { headers: { 'x-forwarded-for': '127.0.0.1' } },
};

describe('DataConsentResolver', () => {
  let resolver: DataConsentResolver;
  let service: jest.Mocked<DataConsentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataConsentResolver,
        {
          provide: DataConsentService,
          useValue: {
            getActivePolicy: jest.fn(),
            getMyConsentStatus: jest.fn(),
            getEmployeeConsentStatus: jest.fn(),
            grantConsent: jest.fn(),
            revokeConsent: jest.fn(),
            listPolicies: jest.fn(),
            publishPolicy: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(DataConsentResolver);
    service = module.get(DataConsentService);
  });

  it('delegates myDataConsentStatus al servicio', async () => {
    const summary = {
      activePolicyVersion: '2026.07.1',
      policy: {
        id: 'p1',
        tenantId: TENANT_ID,
        version: '2026.07.1',
        title: 'Política',
        content: 'Texto',
        consentLabel: 'Acepto',
        publishedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      consents: [],
      biometricEnrolled: false,
      alternateMethodAvailable: true,
    };
    service.getMyConsentStatus.mockResolvedValue(summary);

    const result = await resolver.myDataConsentStatus(makeUser(), emptyContext);

    expect(service.getMyConsentStatus).toHaveBeenCalledWith(USER_ID, TENANT_ID);
    expect(result).toEqual(summary);
  });

  it('delegates grantDataConsent al servicio con metadatos de request', async () => {
    service.grantConsent.mockResolvedValue([
      {
        id: 'c1',
        tenantId: TENANT_ID,
        employeeId: 'emp-1',
        consentType: ConsentType.GEOLOCALIZACION,
        granted: true,
        policyVersion: '2026.07.1',
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        deviceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await resolver.grantDataConsent(makeUser(), emptyContext, {
      policyVersion: '2026.07.1',
      consentTypes: [ConsentType.GEOLOCALIZACION],
      accepted: true,
    });

    expect(service.grantConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        tenantId: TENANT_ID,
        ipAddress: '127.0.0.1',
      }),
      expect.objectContaining({ accepted: true }),
    );
  });
});
