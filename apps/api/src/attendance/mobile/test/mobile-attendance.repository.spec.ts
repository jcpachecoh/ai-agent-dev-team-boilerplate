import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
} from '@prisma/client';
import { MobileAttendanceRepository } from '../repository/mobile-attendance.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('MobileAttendanceRepository', () => {
  const attendanceLogCreate = jest.fn();
  const attendanceLogFindMany = jest.fn();

  const prisma = {
    attendanceLog: {
      create: attendanceLogCreate,
      findMany: attendanceLogFindMany,
    },
    employeeDetails: {
      findFirst: jest.fn(),
    },
    location: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new MobileAttendanceRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create persiste en attendance_logs con source=APP_MOVIL', async () => {
    attendanceLogCreate.mockResolvedValue({ id: 'log-1' });

    await repository.create({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      eventType: AttendanceEventType.ENTRY,
      timestamp: new Date('2026-07-07T12:00:00.000Z'),
      workDate: new Date('2026-07-07T00:00:00.000Z'),
      validationStatus: AttendanceValidationStatus.VALID,
      clientLatitude: 4.6097,
      clientLongitude: -74.0817,
      distanceMeters: 12,
      radiusMeters: 100,
    });

    expect(attendanceLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        locationId: 'loc-1',
        eventType: AttendanceEventType.ENTRY,
        source: AttendanceLogSource.APP_MOVIL,
        validationStatus: AttendanceValidationStatus.VALID,
      }),
    });
  });

  it('findMany filtra attendance_logs por source=APP_MOVIL', async () => {
    attendanceLogFindMany.mockResolvedValue([]);

    await repository.findMany({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      take: 20,
    });

    expect(attendanceLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          employeeId: 'emp-1',
          source: AttendanceLogSource.APP_MOVIL,
          isActive: true,
        }),
        take: 21,
        orderBy: { timestamp: 'desc' },
      }),
    );
  });
});
