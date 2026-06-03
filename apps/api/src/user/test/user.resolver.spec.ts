import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from '../resolver/user.resolver';
import { UserService } from '../service/user.service';

const userId = 'user-1';
const mockUser = {
  id: userId,
  role: 'OPERATOR',
  tenantId: 'tenant-1',
  sedeId: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
};

const serviceMock = {
  getMe: jest.fn(),
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

  it('delegates me to the service', async () => {
    serviceMock.getMe.mockResolvedValue(mockUser);

    const result = await resolver.me({ sub: userId } as never);

    expect(result).toEqual(mockUser);
    expect(serviceMock.getMe).toHaveBeenCalledWith(userId);
  });

  it('delegates updateProfile to the service', async () => {
    serviceMock.updateProfile.mockResolvedValue({ ...mockUser, sedeId: 's-1' });

    const result = await resolver.updateProfile({ sub: userId } as never, { sedeId: 's-1' });

    expect(result).toEqual({ ...mockUser, sedeId: 's-1' });
    expect(serviceMock.updateProfile).toHaveBeenCalledWith(userId, { sedeId: 's-1' });
  });
});
