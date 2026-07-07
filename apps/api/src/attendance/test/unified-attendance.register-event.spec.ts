import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
} from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceRepository } from '../repository/attendance.repository';
import { AuthService } from '../../auth/service/auth.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';

describe('ASIS-UNI — convivencia APP_MOVIL + MANUAL', () => {
  let service: AttendanceService;

  const repoMock = {
    findDuplicateEvent: jest.fn(),
    findOpenEntry: jest.fn(),
    findLocationById: jest.fn(),
    createEventLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: AttendanceRepository, useValue: repoMock },
        { provide: AuthService, useValue: { issueKioskAuthTokens: jest.fn() } },
        {
          provide: ShiftResolutionService,
          useValue: {
            resolveForDay: jest.fn().mockResolvedValue({ kind: 'NONE', targetMinutes: 0 }),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
            assertLocationAllowed: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AttendanceService);
    jest.clearAllMocks();
    repoMock.findDuplicateEvent.mockResolvedValue(null);
    repoMock.findOpenEntry.mockResolvedValue(null);
    repoMock.findLocationById.mockResolvedValue({
      id: 'loc-1',
      geoLatitude: 4.6097,
      geoLongitude: -74.0817,
      checkInRadiusMeters: 100,
    });
  });

  it('mismo empleado, mismo día: ENTRY app + corrección MANUAL conviven sin conflicto', async () => {
    const workDate = new Date('2026-06-10T00:00:00.000Z');
    const timestamp = new Date('2026-06-10T13:00:00.000Z');

    repoMock.createEventLog
      .mockResolvedValueOnce({
        id: 'log-app',
        source: AttendanceLogSource.APP_MOVIL,
        validationStatus: AttendanceValidationStatus.VALID,
      })
      .mockResolvedValueOnce({
        id: 'log-manual',
        source: AttendanceLogSource.MANUAL,
      });

    await service.registerEvent({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      eventType: AttendanceEventType.ENTRY,
      source: AttendanceLogSource.APP_MOVIL,
      timestamp,
      clientLatitude: 4.6097,
      clientLongitude: -74.0817,
    });

    await service.registerEvent({
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      eventType: AttendanceEventType.ENTRY,
      source: AttendanceLogSource.MANUAL,
      timestamp,
      workDate,
      createdByUserId: 'supervisor-1',
      manualReason: 'SUPERVISOR_CORRECTION',
      manualParentLogId: 'log-app',
    });

    expect(repoMock.createEventLog).toHaveBeenCalledTimes(2);
    expect(repoMock.findDuplicateEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ source: AttendanceLogSource.APP_MOVIL }),
    );
    expect(repoMock.findDuplicateEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ source: AttendanceLogSource.MANUAL }),
    );
  });
});
