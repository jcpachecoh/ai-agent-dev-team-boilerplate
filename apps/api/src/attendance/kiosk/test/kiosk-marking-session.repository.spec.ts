import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { KioskMarkingSessionRepository } from '../repository/kiosk-marking-session.repository';

const prismaMock = {
  kioskMarkingSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('KioskMarkingSessionRepository', () => {
  let repo: KioskMarkingSessionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KioskMarkingSessionRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repo = module.get(KioskMarkingSessionRepository);
    jest.clearAllMocks();
  });

  it('create / findById / revoke delegate to prisma', async () => {
    prismaMock.kioskMarkingSession.create.mockResolvedValue({ id: 's1' });
    prismaMock.kioskMarkingSession.findFirst.mockResolvedValue({ id: 's1' });
    prismaMock.kioskMarkingSession.update.mockResolvedValue({ id: 's1', revokedAt: new Date() });

    await expect(
      repo.create({
        tenantId: 't1',
        locationId: 'loc',
        activatedByUserId: 'u1',
        expiresAt: new Date(),
      }),
    ).resolves.toEqual({ id: 's1' });
    await expect(repo.findById('s1', 't1')).resolves.toEqual({ id: 's1' });
    await expect(repo.revoke('s1', 't1')).resolves.toEqual(expect.objectContaining({ id: 's1' }));
  });

  it('revokeIfOwned returns null when missing or wrong owner', async () => {
    prismaMock.kioskMarkingSession.findFirst.mockResolvedValueOnce(null);
    await expect(repo.revokeIfOwned('s1', 't1', 'u1')).resolves.toBeNull();

    prismaMock.kioskMarkingSession.findFirst.mockResolvedValueOnce({
      id: 's1',
      activatedByUserId: 'other',
      revokedAt: null,
    });
    await expect(repo.revokeIfOwned('s1', 't1', 'u1')).resolves.toBeNull();
  });

  it('revokeIfOwned returns existing when already revoked', async () => {
    const existing = { id: 's1', activatedByUserId: 'u1', revokedAt: new Date() };
    prismaMock.kioskMarkingSession.findFirst.mockResolvedValue(existing);
    await expect(repo.revokeIfOwned('s1', 't1', 'u1')).resolves.toEqual(existing);
    expect(prismaMock.kioskMarkingSession.update).not.toHaveBeenCalled();
  });

  it('revokeIfOwned updates when active and owned', async () => {
    prismaMock.kioskMarkingSession.findFirst.mockResolvedValue({
      id: 's1',
      activatedByUserId: 'u1',
      revokedAt: null,
    });
    prismaMock.kioskMarkingSession.update.mockResolvedValue({
      id: 's1',
      revokedAt: new Date(),
    });
    await expect(repo.revokeIfOwned('s1', 't1', 'u1')).resolves.toEqual(
      expect.objectContaining({ id: 's1' }),
    );
    expect(prismaMock.kioskMarkingSession.update).toHaveBeenCalled();
  });
});
