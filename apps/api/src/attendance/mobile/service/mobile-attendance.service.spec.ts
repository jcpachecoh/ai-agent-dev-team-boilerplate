import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MobileAttendanceEventType, MobileAttendanceStatus, StorageDomain } from '@prisma/client';
import { StorageService } from '../../../storage/service/storage.service';
import { MobileAttendanceRepository } from '../repository/mobile-attendance.repository';
import { haversineDistanceMeters, MobileAttendanceService } from './mobile-attendance.service';

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
  eventType: MobileAttendanceEventType.ENTRY,
  status: MobileAttendanceStatus.VALID,
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
      ],
    }).compile();

    service = module.get<MobileAttendanceService>(MobileAttendanceService);
    repo = module.get(MobileAttendanceRepository);
    storageService = module.get(StorageService);
  });

  // ── registrarMarcacion ─────────────────────────────────────────────────────

  describe('registrarMarcacion', () => {
    const validInput = {
      locationId: LOCATION_ID,
      eventType: MobileAttendanceEventType.ENTRY,
      clientLatitude: 4.6097,
      clientLongitude: -74.0817,
    };

    it('crea marcación VALID cuando el empleado está dentro del radio', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      repo.create.mockResolvedValue({ ...mockLog, status: MobileAttendanceStatus.VALID });

      // Act
      const result = await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      // Assert
      expect(result.status).toBe(MobileAttendanceStatus.VALID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          locationId: LOCATION_ID,
          status: MobileAttendanceStatus.VALID,
          rejectionReason: null,
        }),
      );
    });

    it('crea marcación REJECTED cuando el empleado está fuera del radio', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      repo.create.mockResolvedValue({
        ...mockLog,
        status: MobileAttendanceStatus.REJECTED,
        rejectionReason: 'OUTSIDE_RADIUS',
      });

      const inputFuera = {
        ...validInput,
        clientLatitude: 4.7, // ~10 km lejos de la sede
        clientLongitude: -74.0817,
      };

      // Act
      const result = await service.registrarMarcacion(inputFuera, USER_ID, TENANT_ID);

      // Assert
      expect(result.status).toBe(MobileAttendanceStatus.REJECTED);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MobileAttendanceStatus.REJECTED,
          rejectionReason: 'OUTSIDE_RADIUS',
        }),
      );
    });

    it('crea marcación PENDING cuando la sede no tiene geofence configurado', async () => {
      // Arrange
      const locationSinGeo = {
        ...mockLocation,
        geoLatitude: null,
        geoLongitude: null,
        checkInRadiusMeters: null,
      };
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(locationSinGeo);
      repo.create.mockResolvedValue({ ...mockLog, status: MobileAttendanceStatus.PENDING });

      // Act
      const result = await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      // Assert
      expect(result.status).toBe(MobileAttendanceStatus.PENDING);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: MobileAttendanceStatus.PENDING, distanceMeters: null }),
      );
    });

    it('rechaza si el empleado no existe en el tenant', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rechaza si el empleado está inactivo', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue({ ...mockEmployee, isActive: false });

      // Act & Assert
      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rechaza si la sede no pertenece al tenant', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registrarMarcacion(validInput, USER_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.create).not.toHaveBeenCalled();
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
      expect(repo.create).not.toHaveBeenCalled();
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

    it('no permite pasar employeeId desde el input — siempre lo deriva del userId JWT', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repo.findLocationById.mockResolvedValue(mockLocation);
      repo.create.mockResolvedValue(mockLog);

      // Act
      await service.registrarMarcacion(validInput, USER_ID, TENANT_ID);

      // Assert — employeeId viene del repo lookup, no del input
      expect(repo.findEmployeeByUserId).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: EMPLOYEE_ID }),
      );
    });
  });

  // ── misMarcaciones ─────────────────────────────────────────────────────────

  describe('misMarcaciones', () => {
    it('solo devuelve marcaciones del empleado autenticado', async () => {
      // Arrange
      repo.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      const mockConn = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
      repo.findByEmployeeId.mockResolvedValue(mockConn);

      // Act
      const result = await service.misMarcaciones(USER_ID, TENANT_ID, { take: 20 });

      // Assert
      expect(repo.findEmployeeByUserId).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(repo.findByEmployeeId).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        TENANT_ID,
        expect.objectContaining({ take: 20 }),
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
