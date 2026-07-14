import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
  ConsentType,
  StorageDomain,
} from '@prisma/client';
import { StorageService } from '../../../storage/service/storage.service';
import { AttendanceService } from '../../service/attendance.service';
import { DataConsentService } from '../../../data-consent/service/data-consent.service';
import { MobileAttendanceRepository } from '../repository/mobile-attendance.repository';
import { haversineDistanceMeters, MobileAttendanceService } from './mobile-attendance.service';
import { VACATION_MARKING_BLOCKED_MESSAGE } from '../../service/vacation-attendance.guard';

const TENANT_ID = 'tenant-001';
const USER_ID = 'user-001';
const LOCATION_ID = 'loc-001';
const EMPLOYEE_ID = 'emp-001';

const mockEmployee = {
  id: EMPLOYEE_ID,
  userId: USER_ID,
  tenantId: TENANT_ID,
  locationId: LOCATION_ID,
  isActive: true,
  deletedAt: null,
  name: 'Test Employee',
} as any;

const mockLocation = {
  id: LOCATION_ID,
  tenantId: TENANT_ID,
  name: 'Sede Principal',
  geoLatitude: 4.6097,
  geoLongitude: -74.0817,
  checkInRadiusMeters: 100,
  deletedAt: null,
  isActive: true,
} as any;

const mockLog = {
  id: 'log-001',
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  locationId: LOCATION_ID,
  eventType: AttendanceEventType.ENTRY,
  validationStatus: AttendanceValidationStatus.VALID,
  timestamp: new Date(),
  workDate: new Date(),
  clientLatitude: 4.6097,
  clientLongitude: -74.0817,
  distanceMeters: 5,
  radiusMeters: 100,
  rejectionReason: null,
} as any;

describe('MobileAttendanceService', () => {
  let service: MobileAttendanceService;
  let repo: jest.Mocked<MobileAttendanceRepository>;
  let storageService: jest.Mocked<StorageService>;

  let attendanceService: jest.Mocked<AttendanceService>;
  let dataConsentService: jest.Mocked<DataConsentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileAttendanceService,
        {
          provide: MobileAttendanceRepository,
          useValue: {
            findEmployeeByUserId: jest.fn(),
            findEmployeeWithFacialReference: jest.fn(),
            findLocationById: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            findByEmployeeId: jest.fn(),
            findByLocationId: jest.fn(),
            findByEmployeeIdAdmin: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            findById: jest.fn(),
            getPresignedUrl: jest.fn(),
          },
        },
        { provide: AttendanceService, useValue: { registerEvent: jest.fn() } },
        {
          provide: DataConsentService,
          useValue: { assertConsentForFeature: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<MobileAttendanceService>(MobileAttendanceService);
    repo = module.get(MobileAttendanceRepository);
    storageService = module.get(StorageService);
    attendanceService = module.get(AttendanceService);
    dataConsentService = module.get(DataConsentService);
  });

  // ── registrarMarcacion ─────────────────────────────────────────────────────

  describe('registrarMarcacion', () => {
    const validInput = {
      locationId: LOCATION_ID,
      eventType: AttendanceEventType.ENTRY,
      clientLatitude: 4.6097,
      clientLongitude: -74.0817,
    };

    it('delega en registerEvent con source=APP_MOVIL y retorna VALID', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      attendanceService.registerEvent.mockResolvedValue({
        ...mockLog,
        validationStatus: AttendanceValidationStatus.VALID,
      });

      const result = await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      expect(result.status).toBe(AttendanceValidationStatus.VALID);
      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          locationId: LOCATION_ID,
          source: AttendanceLogSource.APP_MOVIL,
          clientLatitude: 4.6097,
          clientLongitude: -74.0817,
        }),
      );
    });

    it('rechaza marcación cuando registerEvent detecta vacaciones aprobadas (D6)', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      attendanceService.registerEvent.mockRejectedValue(
        new ConflictException(VACATION_MARKING_BLOCKED_MESSAGE),
      );

      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        VACATION_MARKING_BLOCKED_MESSAGE,
      );
    });

    it('retorna REJECTED cuando registerEvent persiste validación fuera de radio', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      attendanceService.registerEvent.mockResolvedValue({
        ...mockLog,
        validationStatus: AttendanceValidationStatus.REJECTED,
        rejectionReason: 'OUTSIDE_RADIUS',
      });

      const inputFuera = {
        ...validInput,
        clientLatitude: 4.7,
        clientLongitude: -74.0817,
      };

      const result = await service.registrarMarcacion(inputFuera, USER_ID, TENANT_ID);

      expect(result.status).toBe(AttendanceValidationStatus.REJECTED);
      expect(attendanceService.registerEvent).toHaveBeenCalled();
    });

    it('retorna PENDING cuando registerEvent no tiene geofence', async () => {
      const locationSinGeo = {
        ...mockLocation,
        geoLatitude: null,
        geoLongitude: null,
        checkInRadiusMeters: null,
      };
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(locationSinGeo);
      attendanceService.registerEvent.mockResolvedValue({
        ...mockLog,
        validationStatus: AttendanceValidationStatus.PENDING,
        distanceMeters: null,
      });

      const result = await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      expect(result.status).toBe(AttendanceValidationStatus.PENDING);
    });

    it('rechaza si el empleado no existe en el tenant', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('rechaza si el empleado está inactivo', async () => {
      repo.findEmployeeByUserId.mockResolvedValue({ ...mockEmployee, isActive: false });

      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('rechaza si la sede no pertenece al tenant', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(null);

      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('rechaza si el empleado no está asignado a la sede solicitada', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue({
        ...mockEmployee,
        locationId: 'otra-sede',
      });
      repo.findLocationById.mockResolvedValue(mockLocation);

      // Act & Assert
      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('rechaza si el timestamp está desfasado más de 5 minutos', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);

      const inputConTimestampViejo = {
        ...validInput,
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
      };

      // Act & Assert
      await expect(
        service.registrarMarcacion(inputConTimestampViejo, USER_ID, TENANT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si storageObjectId no pertenece al usuario', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      storageService.findById.mockResolvedValue({
        id: 'storage-001',
        tenantId: TENANT_ID,
        uploadedBy: 'otro-usuario',
        domain: StorageDomain.PAYROLL,
        publicUrl: 'https://r2.example.com/img.jpg',
      } as any);

      // Act & Assert
      await expect(
        service.registrarMarcacion(
          { ...validInput, storageObjectId: 'storage-001' },
          USER_ID,
          TENANT_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si storageObjectId tiene dominio incorrecto', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      storageService.findById.mockResolvedValue({
        id: 'storage-001',
        tenantId: TENANT_ID,
        uploadedBy: USER_ID,
        domain: StorageDomain.RECIPES,
        publicUrl: 'https://r2.example.com/img.jpg',
      } as any);

      // Act & Assert
      await expect(
        service.registrarMarcacion(
          { ...validInput, storageObjectId: 'storage-001' },
          USER_ID,
          TENANT_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('valida consentimiento biométrico cuando hay evidencia facial', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      attendanceService.registerEvent.mockResolvedValue(mockLog);

      await service.registrarMarcacion(
        { ...validInput, facialMatchScore: 0.92 },
        USER_ID,
        TENANT_ID,
      );

      expect(dataConsentService.assertConsentForFeature).toHaveBeenCalledWith({
        userId: USER_ID,
        tenantId: TENANT_ID,
        consentType: ConsentType.GEOLOCALIZACION,
      });
      expect(dataConsentService.assertConsentForFeature).toHaveBeenCalledWith({
        userId: USER_ID,
        tenantId: TENANT_ID,
        consentType: ConsentType.BIOMETRICO_FACIAL,
      });
    });

    it('propaga photoUrl cuando la marcación incluye storageObjectId válido', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      storageService.findById.mockResolvedValue({
        id: 'storage-001',
        tenantId: TENANT_ID,
        uploadedBy: USER_ID,
        domain: StorageDomain.PAYROLL,
        publicUrl: 'https://r2.example.com/img.jpg',
      } as any);
      attendanceService.registerEvent.mockResolvedValue(mockLog);

      await service.registrarMarcacion(
        { ...validInput, storageObjectId: 'storage-001' },
        USER_ID,
        TENANT_ID,
      );

      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          storageObjectId: 'storage-001',
          photoUrl: 'https://r2.example.com/img.jpg',
        }),
      );
    });

    it('no permite pasar employeeId desde el input — siempre lo deriva del userId JWT', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      attendanceService.registerEvent.mockResolvedValue(mockLog);

      await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      expect(repo.findEmployeeByUserId).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: EMPLOYEE_ID, source: AttendanceLogSource.APP_MOVIL }),
      );
    });
  });

  // ── misMarcaciones ─────────────────────────────────────────────────────────

  describe('misMarcaciones', () => {
    it('solo devuelve marcaciones del empleado autenticado', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      const mockConn = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
      repo.findMany.mockResolvedValue(mockConn);

      // Act
      const result = await service.misMarcaciones(USER_ID, TENANT_ID, { take: 20 });

      // Assert
      expect(repo.findEmployeeByUserId).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          take: 20,
        }),
      );
      expect(result).toBe(mockConn);
    });

    it('lanza NotFoundException si el empleado no existe', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.misMarcaciones(USER_ID, TENANT_ID, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── marcacionesPorSede ─────────────────────────────────────────────────────

  describe('marcacionesPorSede', () => {
    it('requiere que la sede pertenezca al tenant', async () => {
      // Arrange
      repo.findLocationById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.marcacionesPorSede(
          { locationId: 'otra-sede', dateFrom: '2026-01-01', dateTo: '2026-01-31', take: 20 },
          TENANT_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('devuelve marcaciones con cursor pagination para la sede', async () => {
      // Arrange
      repo.findLocationById.mockResolvedValue(mockLocation);
      const mockConn = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
      repo.findByLocationId.mockResolvedValue(mockConn);

      // Act
      const result = await service.marcacionesPorSede(
        { locationId: LOCATION_ID, dateFrom: '2026-01-01', dateTo: '2026-01-31', take: 10 },
        TENANT_ID,
      );

      // Assert
      expect(repo.findByLocationId).toHaveBeenCalledWith(
        LOCATION_ID,
        TENANT_ID,
        expect.objectContaining({ take: 10 }),
      );
      expect(result).toBe(mockConn);
    });
  });

  // ── haversineDistanceMeters ────────────────────────────────────────────────

  describe('misDatosFaciales', () => {
    const mockEmployeeWithPhoto = {
      ...mockEmployee,
      photoStorageObjectId: 'photo-storage-001',
      updatedAt: new Date('2026-06-01T10:00:00Z'),
      personalData: null,
    };

    it('devuelve referencia facial con URL firmada cuando hay foto en employee', async () => {
      // Arrange
      repo.findEmployeeWithFacialReference.mockResolvedValue(mockEmployeeWithPhoto);
      storageService.getPresignedUrl.mockResolvedValue('https://signed.example.com/photo.jpg');

      // Act
      const result = await service.misDatosFaciales(USER_ID, TENANT_ID);

      // Assert
      expect(result).toEqual({
        storageObjectId: 'photo-storage-001',
        signedUrl: 'https://signed.example.com/photo.jpg',
        version: 'photo-storage-001',
        updatedAt: mockEmployeeWithPhoto.updatedAt,
      });
      expect(storageService.getPresignedUrl).toHaveBeenCalledWith(
        'photo-storage-001',
        TENANT_ID,
        600,
      );
    });

    it('prioriza profilePhotoStorageObjectId de personalData sobre photoStorageObjectId', async () => {
      // Arrange
      const personalUpdatedAt = new Date('2026-06-15T12:00:00Z');
      repo.findEmployeeWithFacialReference.mockResolvedValue({
        ...mockEmployeeWithPhoto,
        personalData: {
          profilePhotoStorageObjectId: 'personal-photo-001',
          updatedAt: personalUpdatedAt,
        },
      });
      storageService.getPresignedUrl.mockResolvedValue('https://signed.example.com/personal.jpg');

      // Act
      const result = await service.misDatosFaciales(USER_ID, TENANT_ID);

      // Assert
      expect(result?.storageObjectId).toBe('personal-photo-001');
      expect(result?.version).toBe('personal-photo-001');
      expect(result?.updatedAt).toBe(personalUpdatedAt);
      expect(storageService.getPresignedUrl).toHaveBeenCalledWith(
        'personal-photo-001',
        TENANT_ID,
        600,
      );
    });

    it('devuelve null si el empleado no existe', async () => {
      // Arrange
      repo.findEmployeeWithFacialReference.mockResolvedValue(null);

      // Act
      const result = await service.misDatosFaciales(USER_ID, TENANT_ID);

      // Assert
      expect(result).toBeNull();
      expect(storageService.getPresignedUrl).not.toHaveBeenCalled();
    });

    it('devuelve null si no hay foto de referencia (opción A — app bloquea marcación)', async () => {
      // Arrange
      repo.findEmployeeWithFacialReference.mockResolvedValue({
        ...mockEmployeeWithPhoto,
        photoStorageObjectId: null,
        personalData: null,
      });

      // Act
      const result = await service.misDatosFaciales(USER_ID, TENANT_ID);

      // Assert
      expect(result).toBeNull();
      expect(storageService.getPresignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('miSede', () => {
    it('devuelve la configuración de la sede asignada al empleado', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);

      // Act
      const result = await service.miSede(USER_ID, TENANT_ID);

      // Assert
      expect(repo.findLocationById).toHaveBeenCalledWith(LOCATION_ID, TENANT_ID);
      expect(result).toEqual({
        locationId: LOCATION_ID,
        name: 'Sede Principal',
        geoLatitude: 4.6097,
        geoLongitude: -74.0817,
        checkInRadiusMeters: 100,
        requiresPhoto: true,
      });
    });

    it('lanza NotFoundException si el empleado no existe', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.miSede(USER_ID, TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si la sede del empleado no existe', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.miSede(USER_ID, TENANT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('haversineDistanceMeters', () => {
    it('calcula ~2445 km entre Bogotá y Madrid', () => {
      // Bogotá: 4.6097, -74.0817 — Madrid: 40.4168, -3.7038
      const dist = haversineDistanceMeters(4.6097, -74.0817, 40.4168, -3.7038);
      expect(dist).toBeGreaterThan(8_000_000); // > 8000 km
      expect(dist).toBeLessThan(9_000_000);
    });

    it('calcula ~0 metros para el mismo punto', () => {
      const dist = haversineDistanceMeters(4.6097, -74.0817, 4.6097, -74.0817);
      expect(dist).toBeCloseTo(0, 1);
    });

    it('calcula distancia correcta entre puntos cercanos', () => {
      // ~111 metros por 0.001 grado de latitud
      const dist = haversineDistanceMeters(4.6097, -74.0817, 4.6097 + 0.001, -74.0817);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(120);
    });
  });
});
