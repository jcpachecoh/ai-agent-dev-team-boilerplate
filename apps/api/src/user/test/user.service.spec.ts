import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../service/user.service';
import { UserRepository } from '../repository/user.repository';

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

const repoMock = {
  findById: jest.fn(),
  updateProfile: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: repoMock }],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('returns the current user when found', async () => {
    repoMock.findById.mockResolvedValue(mockUser);

    const result = await service.getMe(userId);

    expect(result).toEqual(mockUser);
    expect(repoMock.findById).toHaveBeenCalledWith(userId);
  });

  it('throws when updating a missing profile', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.updateProfile(userId, { sedeId: 's-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates the profile when the user exists', async () => {
    repoMock.findById.mockResolvedValue(mockUser);
    repoMock.updateProfile.mockResolvedValue({ ...mockUser, sedeId: 's-1' });

    const result = await service.updateProfile(userId, { sedeId: 's-1' });

    expect(result).toEqual({ ...mockUser, sedeId: 's-1' });
    expect(repoMock.updateProfile).toHaveBeenCalledWith(userId, { sedeId: 's-1' });
  });
});
