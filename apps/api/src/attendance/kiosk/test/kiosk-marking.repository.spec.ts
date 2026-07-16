import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventType, AttendanceLogSource } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { KioskMarkingRepository } from '../repository/kiosk-marking.repository';

const prismaMock = {
  location: { findFirst: jest.fn() },
  employeeDetails: { findMany: jest.fn(), findFirst: jest.fn() },
  turnoAssignment: { findMany: jest.fn() },
  attendanceLog: { findFirst: jest.fn(), updateMany: jest.fn() },
  dataConsent: { findFirst: jest.fn() },
  dataProcessingPolicy: { findFirst: jest.fn() },
};

describe('KioskMarkingRepository', () => {
  let repo: KioskMarkingRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KioskMarkingRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repo = module.get(KioskMarkingRepository);
    jest.clearAllMocks();
  });

  it('findEmployeesByIds returns [] for empty ids', async () => {
    await expect(repo.findEmployeesByIds('t1', [])).resolves.toEqual([]);
    expect(prismaMock.employeeDetails.findMany).not.toHaveBeenCalled();
  });

  it('findEmployeeIdsWithAssignmentAtLocation dedupes ids', async () => {
    prismaMock.turnoAssignment.findMany.mockResolvedValue([
      { employeeId: 'e1' },
      { employeeId: 'e1' },
      { employeeId: 'e2' },
    ]);
    await expect(
      repo.findEmployeeIdsWithAssignmentAtLocation('t1', 'loc', new Date()),
    ).resolves.toEqual(['e1', 'e2']);
  });

  it('findOpenEntry returns null when no entry', async () => {
    prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(null);
    await expect(repo.findOpenEntry('emp')).resolves.toBeNull();
  });

  it('findOpenEntry returns null when exit exists after entry', async () => {
    const entry = {
      id: 'entry-1',
      timestamp: new Date('2026-07-16T12:00:00Z'),
      eventType: AttendanceEventType.ENTRY,
    };
    prismaMock.attendanceLog.findFirst
      .mockResolvedValueOnce(entry)
      .mockResolvedValueOnce({ id: 'exit-1' });
    await expect(repo.findOpenEntry('emp')).resolves.toBeNull();
  });

  it('findOpenEntry returns entry when still open', async () => {
    const entry = {
      id: 'entry-1',
      timestamp: new Date('2026-07-16T12:00:00Z'),
      eventType: AttendanceEventType.ENTRY,
      source: AttendanceLogSource.KIOSK,
    };
    prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(entry).mockResolvedValueOnce(null);
    await expect(repo.findOpenEntry('emp')).resolves.toEqual(entry);
  });

  it('hasActiveBiometricConsent true/false', async () => {
    prismaMock.dataConsent.findFirst.mockResolvedValueOnce({ id: 'c1' });
    await expect(repo.hasActiveBiometricConsent('t1', 'e1', 'v1')).resolves.toBe(true);
    prismaMock.dataConsent.findFirst.mockResolvedValueOnce(null);
    await expect(repo.hasActiveBiometricConsent('t1', 'e1', 'v1')).resolves.toBe(false);
  });

  it('findActivePolicyVersion returns version or null', async () => {
    prismaMock.dataProcessingPolicy.findFirst.mockResolvedValueOnce({ version: '2026.07.1' });
    await expect(repo.findActivePolicyVersion('t1')).resolves.toBe('2026.07.1');
    prismaMock.dataProcessingPolicy.findFirst.mockResolvedValueOnce(null);
    await expect(repo.findActivePolicyVersion('t1')).resolves.toBeNull();
  });

  it('deactivateLog updates and returns row', async () => {
    const row = { id: 'log-1', tenantId: 't1', isActive: false };
    prismaMock.attendanceLog.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.attendanceLog.findFirst.mockResolvedValue(row);
    await expect(repo.deactivateLog('log-1', 't1')).resolves.toEqual(row);
  });

  it('deactivateLog throws when not found', async () => {
    prismaMock.attendanceLog.updateMany.mockResolvedValue({ count: 0 });
    await expect(repo.deactivateLog('missing', 't1')).rejects.toThrow('not found for tenant');
  });

  it('deactivateLog throws when row missing after update', async () => {
    prismaMock.attendanceLog.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.attendanceLog.findFirst.mockResolvedValue(null);
    await expect(repo.deactivateLog('log-1', 't1')).rejects.toThrow('not found after deactivate');
  });

  it('formatWorkDate returns YYYY-MM-DD', () => {
    expect(repo.formatWorkDate(new Date('2026-07-16T15:00:00.000Z'))).toBe('2026-07-16');
  });
});
