import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from '../resolver/user.resolver';
import { UserService } from '../service/user.service';

const globalUserId = '11111111-0000-0000-0000-000000000004';
const tenantId = 'palos-de-lena';
const mockProfile = {
  id: 'dddddddd-0000-0000-0000-000000000004',
  userId: globalUserId,
  role: 'OWNER',
  tenantId,
  sedeId: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
};

const gqlContext = { req: { headers: { 'x-tenant-id': tenantId } } };

const serviceMock = {
  getOperationalProfile: jest.fn(),
  updateProfile: jest.fn(),
};

describe('UserResolver', () => {
  let resolver: UserResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserResolver, { provide: UserService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    jest.clearAllMocks();
  });

  it('delegates operationalProfile using global user sub and x-tenant-id', async () => {
    serviceMock.getOperationalProfile.mockResolvedValue(mockProfile);

    const result = await resolver.operationalProfile(
      { sub: globalUserId, email: 'owner@example.com' },
      gqlContext,
    );

    expect(result).toEqual(mockProfile);
    expect(serviceMock.getOperationalProfile).toHaveBeenCalledWith(globalUserId, tenantId);
  });

  it('delegates updateProfile to the service', async () => {
    serviceMock.updateProfile.mockResolvedValue({ ...mockProfile, sedeId: 's-1' });

    const result = await resolver.updateProfile({ sub: globalUserId } as never, {
      sedeId: 's-1',
    });

    expect(result).toEqual({ ...mockProfile, sedeId: 's-1' });
    expect(serviceMock.updateProfile).toHaveBeenCalledWith(globalUserId, { sedeId: 's-1' });
  });
});
