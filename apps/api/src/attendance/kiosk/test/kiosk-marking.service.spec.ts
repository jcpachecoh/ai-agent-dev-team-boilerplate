import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceVerificationMethod,
  AuditAction,
  StorageDomain,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import * as bcrypt from 'bcrypt';
import { KioskMarkingService } from '../service/kiosk-marking.service';
import { POST_CUTOFF_USE_NOVEDAD } from '../interfaces/kiosk-marking.interfaces';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const TENANT = 'tenant-1';
const LOCATION = 'loc-1';
const ADMIN = 'admin-1';
const EMP = 'emp-1';
const SESSION = 'session-1';

const token = {
  sub: ADMIN,
  tenantId: TENANT,
  locationId: LOCATION,
  sessionId: SESSION,
  roleCode: 'SUPERVISOR',
};

const employee = {
  id: EMP,
  userId: 'user-emp-1',
  tenantId: TENANT,
  name: 'Ana Pérez',
  locationId: LOCATION,
  pinHash: '$2b$12$hash',
  photoStorageObjectId: 'photo-ref-1',
  personalData: { profilePhotoStorageObjectId: 'photo-ref-1', updatedAt: new Date() },
  user: { id: 'user-emp-1', cedula: '123' },
  isActive: true,
};

describe('KioskMarkingService', () => {
  const kioskRepositoryMock = {
    findEmployeesAtLocation: jest.fn(),
    findEmployeeIdsWithAssignmentAtLocation: jest.fn(),
    findEmployeesByIds: jest.fn(),
    findEmployeeById: jest.fn(),
    findOpenEntry: jest.fn(),
    hasActiveBiometricConsent: jest.fn(),
    findActivePolicyVersion: jest.fn(),
    findKioskLogById: jest.fn(),
    deactivateLog: jest.fn(),
    formatWorkDate: jest.fn().mockReturnValue('2026-07-16'),
  };

  const shiftResolutionMock = {
    resolveForDay: jest.fn(),
  };

  const attendanceServiceMock = {
    registerEvent: jest.fn(),
  };

  const jornadaCutoffMock = {
    isBeforeCutoff: jest.fn(),
  };

  const storageServiceMock = {
    findById: jest.fn(),
    getPresignedUrl: jest.fn(),
  };

  const auditServiceMock = {
    log: jest.fn(),
  };

  const userLocationsMock = {
    resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
    assertLocationAllowed: jest.fn(),
  };

  let service: KioskMarkingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KioskMarkingService(
      kioskRepositoryMock as never,
      shiftResolutionMock as never,
      attendanceServiceMock as never,
      jornadaCutoffMock as never,
      storageServiceMock as never,
      auditServiceMock as never,
      userLocationsMock as never,
    );

    kioskRepositoryMock.findActivePolicyVersion.mockResolvedValue('2026.07.1');
    kioskRepositoryMock.hasActiveBiometricConsent.mockResolvedValue(true);
    kioskRepositoryMock.findEmployeeById.mockResolvedValue(employee);
    kioskRepositoryMock.findEmployeesByIds.mockResolvedValue([]);
    shiftResolutionMock.resolveForDay.mockResolvedValue({
      kind: 'ASSIGNED',
      source: 'CALENDAR',
      turno: {
        id: 't1',
        nombre: 'Mañana',
        sigla: 'M',
        horaInicio: '08:00',
        horaFin: '16:00',
        jornada: 'DIURNO',
        locationId: LOCATION,
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      targetMinutes: 480,
    });
    storageServiceMock.findById.mockResolvedValue({
      id: 'storage-1',
      domain: StorageDomain.PAYROLL,
      uploadedBy: ADMIN,
      publicUrl: 'https://cdn.example/photo.jpg',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('listEmpleadosTurnoHoy', () => {
    it('incluye solo empleados con turno ASSIGNED', async () => {
      kioskRepositoryMock.findEmployeesAtLocation.mockResolvedValue([employee]);
      kioskRepositoryMock.findEmployeeIdsWithAssignmentAtLocation.mockResolvedValue([]);
      kioskRepositoryMock.findOpenEntry.mockResolvedValue(null);

      const rows = await service.listEmpleadosTurnoHoy(token);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.employeeId).toBe(EMP);
      expect(rows[0]?.suggestedEventType).toBe(AttendanceEventType.ENTRY);
    });

    it('excluye REST/NONE', async () => {
      kioskRepositoryMock.findEmployeesAtLocation.mockResolvedValue([employee]);
      kioskRepositoryMock.findEmployeeIdsWithAssignmentAtLocation.mockResolvedValue([]);
      shiftResolutionMock.resolveForDay.mockResolvedValue({ kind: 'REST', targetMinutes: 0 });

      const rows = await service.listEmpleadosTurnoHoy(token);
      expect(rows).toHaveLength(0);
    });
  });

  describe('registrarMarcacion', () => {
    it('match facial exitoso → FACIAL_MATCH sin PIN', async () => {
      attendanceServiceMock.registerEvent.mockResolvedValue({
        id: 'log-1',
        eventType: AttendanceEventType.ENTRY,
        workDate: new Date('2026-07-16T05:00:00.000Z'),
        timestamp: new Date(),
      });

      const result = await service.registrarMarcacion(token, {
        employeeId: EMP,
        eventType: AttendanceEventType.ENTRY,
        storageObjectId: 'storage-1',
        facialMatchScore: 0.92,
        facialMatchResult: 'MATCH',
      });

      expect(result.verificationMethod).toBe(AttendanceVerificationMethod.FACIAL_MATCH);
      expect(attendanceServiceMock.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          source: AttendanceLogSource.KIOSK,
          verificationMethod: AttendanceVerificationMethod.FACIAL_MATCH,
          kioskSessionId: SESSION,
        }),
      );
    });

    it('match facial bajo + PIN correcto → PIN', async () => {
      attendanceServiceMock.registerEvent.mockResolvedValue({
        id: 'log-2',
        eventType: AttendanceEventType.ENTRY,
        workDate: new Date('2026-07-16T05:00:00.000Z'),
        timestamp: new Date(),
      });

      const result = await service.registrarMarcacion(token, {
        employeeId: EMP,
        eventType: AttendanceEventType.ENTRY,
        storageObjectId: 'storage-1',
        facialMatchScore: 0.4,
        facialMatchResult: 'NO_MATCH',
        pin: '1234',
      });

      expect(result.verificationMethod).toBe(AttendanceVerificationMethod.PIN);
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('match facial bajo + PIN incorrecto → 401 sin log', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.2,
          pin: '0000',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(attendanceServiceMock.registerEvent).not.toHaveBeenCalled();
    });

    it('match facial bajo sin PIN → 401', async () => {
      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.2,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('timestamp desfasado → BadRequest', async () => {
      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.99,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
        }),
      ).rejects.toThrow('Timestamp demasiado desfasado');
    });

    it('storageObjectId de otro usuario → Forbidden', async () => {
      storageServiceMock.findById.mockResolvedValue({
        id: 'storage-1',
        domain: StorageDomain.PAYROLL,
        uploadedBy: 'other-user',
        publicUrl: 'https://cdn.example/photo.jpg',
      });

      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.99,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('storageObjectId dominio incorrecto → BadRequest', async () => {
      storageServiceMock.findById.mockResolvedValue({
        id: 'storage-1',
        domain: 'INVENTORY',
        uploadedBy: ADMIN,
        publicUrl: 'https://cdn.example/photo.jpg',
      });

      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.99,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('empleado sin turno hoy → Forbidden', async () => {
      shiftResolutionMock.resolveForDay.mockResolvedValue({ kind: 'NONE', targetMinutes: 0 });

      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          facialMatchScore: 0.99,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sin consentimiento biométrico exige PIN', async () => {
      kioskRepositoryMock.hasActiveBiometricConsent.mockResolvedValue(false);
      attendanceServiceMock.registerEvent.mockResolvedValue({
        id: 'log-3',
        eventType: AttendanceEventType.ENTRY,
        workDate: new Date('2026-07-16T05:00:00.000Z'),
        timestamp: new Date(),
      });

      const result = await service.registrarMarcacion(token, {
        employeeId: EMP,
        eventType: AttendanceEventType.ENTRY,
        storageObjectId: 'storage-1',
        facialMatchScore: 0.99,
        pin: '1234',
      });

      expect(result.verificationMethod).toBe(AttendanceVerificationMethod.PIN);
    });

    it('PIN no configurado → UnprocessableEntity', async () => {
      kioskRepositoryMock.findEmployeeById.mockResolvedValue({ ...employee, pinHash: null });
      kioskRepositoryMock.hasActiveBiometricConsent.mockResolvedValue(false);

      await expect(
        service.registrarMarcacion(token, {
          employeeId: EMP,
          eventType: AttendanceEventType.ENTRY,
          storageObjectId: 'storage-1',
          pin: '1234',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('anularMarcacion / corregirMarcacion', () => {
    const parentLog = {
      id: 'log-kiosk-1',
      tenantId: TENANT,
      employeeId: EMP,
      locationId: LOCATION,
      eventType: AttendanceEventType.ENTRY,
      workDate: new Date('2026-07-16T05:00:00.000Z'),
      timestamp: new Date(),
      source: AttendanceLogSource.KIOSK,
      isActive: true,
      notes: null,
      verificationMethod: AttendanceVerificationMethod.FACIAL_MATCH,
      kioskSessionId: SESSION,
    };

    it('anulación pre-corte desactiva y audita', async () => {
      kioskRepositoryMock.findKioskLogById.mockResolvedValue(parentLog);
      jornadaCutoffMock.isBeforeCutoff.mockResolvedValue(true);
      kioskRepositoryMock.deactivateLog.mockResolvedValue({ ...parentLog, isActive: false });

      const result = await service.anularMarcacion('log-kiosk-1', 'Error de selección', {
        sub: ADMIN,
        tenantId: TENANT,
        roleCode: 'SUPERVISOR',
      });

      expect(result.isActive).toBe(false);
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entityId: 'log-kiosk-1',
          payload: expect.objectContaining({ operation: 'anularMarcacionKiosko' }),
        }),
      );
    });

    it('corrección post-corte → POST_CUTOFF_USE_NOVEDAD', async () => {
      kioskRepositoryMock.findKioskLogById.mockResolvedValue(parentLog);
      jornadaCutoffMock.isBeforeCutoff.mockResolvedValue(false);

      await expect(
        service.corregirMarcacion(
          {
            attendanceLogId: 'log-kiosk-1',
            eventType: AttendanceEventType.ENTRY,
            timestamp: new Date(),
            reason: 'Ajuste hora',
          },
          { sub: ADMIN, tenantId: TENANT, roleCode: 'SUPERVISOR' },
        ),
      ).rejects.toMatchObject({
        extensions: { code: POST_CUTOFF_USE_NOVEDAD },
      });

      expect(attendanceServiceMock.registerEvent).not.toHaveBeenCalled();
    });

    it('token sin rol de nómina no puede anular', async () => {
      kioskRepositoryMock.findKioskLogById.mockResolvedValue(parentLog);

      await expect(
        service.anularMarcacion('log-kiosk-1', 'motivo', {
          sub: ADMIN,
          tenantId: TENANT,
          roleCode: 'OPERATOR',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('motivo vacío → BadRequest', async () => {
      await expect(
        service.anularMarcacion('log-kiosk-1', '   ', {
          sub: ADMIN,
          tenantId: TENANT,
          roleCode: 'SUPERVISOR',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('marcación ya anulada → Conflict', async () => {
      kioskRepositoryMock.findKioskLogById.mockResolvedValue({ ...parentLog, isActive: false });
      jornadaCutoffMock.isBeforeCutoff.mockResolvedValue(true);

      await expect(
        service.anularMarcacion('log-kiosk-1', 'motivo', {
          sub: ADMIN,
          tenantId: TENANT,
          roleCode: 'SUPERVISOR',
        }),
      ).rejects.toThrow('ya está anulada');
    });
  });

  describe('getFotoReferencia / verificarPin', () => {
    it('devuelve URL firmada', async () => {
      storageServiceMock.getPresignedUrl.mockResolvedValue('https://signed/photo.jpg');

      const result = await service.getFotoReferencia(token, EMP);

      expect(result.photoUrl).toBe('https://signed/photo.jpg');
      expect(result.employeeId).toBe(EMP);
    });

    it('404 sin foto de referencia', async () => {
      kioskRepositoryMock.findEmployeeById.mockResolvedValue({
        ...employee,
        photoStorageObjectId: null,
        personalData: null,
      });

      await expect(service.getFotoReferencia(token, EMP)).rejects.toThrow('sin foto de referencia');
    });

    it('verificarPin OK', async () => {
      await expect(service.verificarPin(token, { employeeId: EMP, pin: '1234' })).resolves.toBe(
        true,
      );
    });

    it('workDate inválido en lista → BadRequest', async () => {
      await expect(service.listEmpleadosTurnoHoy(token, '16-07-2026')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

describe('KioskMarkingGuard token rejection helper', () => {
  it('GraphQLError POST_CUTOFF is GraphQLError', () => {
    const err = new GraphQLError('x', { extensions: { code: POST_CUTOFF_USE_NOVEDAD } });
    expect(err.extensions?.code).toBe(POST_CUTOFF_USE_NOVEDAD);
  });
});
