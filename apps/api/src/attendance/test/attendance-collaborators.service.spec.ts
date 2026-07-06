import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmailService } from '@restopsiq/email';

import { AuditService } from '../../audit/service/audit.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { AttendanceCollaboratorsRepository } from '../repository/attendance-collaborators.repository';
import { AttendanceCollaboratorsExcelService } from '../service/attendance-collaborators-excel.service';
import { AttendanceCollaboratorsPdfService } from '../service/attendance-collaborators-pdf.service';
import { AttendanceCollaboratorsService } from '../service/attendance-collaborators.service';
import type { CollaboratorRecord } from '../interfaces/attendance-collaborators.interfaces';

const TENANT = 'tenant-1';

function buildRecord(overrides: Partial<CollaboratorRecord> = {}): CollaboratorRecord {
  return {
    id: 'emp-1',
    userId: 'user-1',
    locationId: 'loc-1',
    locationName: 'Sede Norte',
    name: 'Ana Pérez',
    primerApellido: 'Pérez',
    segundoApellido: 'Gómez',
    cedula: '123456',
    email: 'ana@example.com',
    positionId: 'pos-1',
    positionName: 'Cocinero',
    area: 'Cocina',
    contractType: 'INDEFINIDO' as never,
    laborClassification: 'COCINA' as never,
    isActive: true,
    portalWorkerEnabled: false,
    ...overrides,
  };
}

describe('AttendanceCollaboratorsService', () => {
  let service: AttendanceCollaboratorsService;
  let repository: jest.Mocked<AttendanceCollaboratorsRepository>;
  let userLocationsService: jest.Mocked<UserLocationsService>;
  let auditService: jest.Mocked<AuditService>;
  let excelService: jest.Mocked<AttendanceCollaboratorsExcelService>;
  let pdfService: jest.Mocked<AttendanceCollaboratorsPdfService>;
  let emailService: jest.Mocked<EmailService>;

  const ownerActor = { userId: 'owner-1', roleCode: 'OWNER' };
  const nominaActor = { userId: 'nomina-1', roleCode: 'NOMINA' };
  const supervisorActor = { userId: 'sup-1', roleCode: 'SUPERVISOR' };

  const baseFilters = {
    page: 1,
    pageSize: 20,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceCollaboratorsService,
        {
          provide: AttendanceCollaboratorsRepository,
          useValue: {
            findPage: jest.fn(),
            findMatchingIdsBySearch: jest.fn(),
            findSupervisorsForLocations: jest.fn(),
            findTodayAssignments: jest.fn(),
            findSupervisorUser: jest.fn(),
            findSupervisorOptions: jest.fn(),
            findEmployeeForPortalToggle: jest.fn(),
            updatePortalWorkerEnabled: jest.fn(),
          },
        },
        {
          provide: UserLocationsService,
          useValue: { getActiveUserLocations: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn(), findRecentByEntity: jest.fn() },
        },
        {
          provide: AttendanceCollaboratorsExcelService,
          useValue: { generateXlsx: jest.fn() },
        },
        {
          provide: AttendanceCollaboratorsPdfService,
          useValue: { generatePdf: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { send: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AttendanceCollaboratorsService);
    repository = module.get(AttendanceCollaboratorsRepository);
    userLocationsService = module.get(UserLocationsService);
    auditService = module.get(AuditService);
    excelService = module.get(AttendanceCollaboratorsExcelService);
    pdfService = module.get(AttendanceCollaboratorsPdfService);
    emailService = module.get(EmailService);

    repository.findPage.mockResolvedValue({
      items: [buildRecord()],
      total: 1,
      activeTotal: 1,
      inactiveTotal: 0,
    });
    repository.findSupervisorsForLocations.mockResolvedValue(new Map());
    repository.findTodayAssignments.mockResolvedValue(new Map());
    excelService.generateXlsx.mockResolvedValue(Buffer.from('xlsx'));
    pdfService.generatePdf.mockResolvedValue(Buffer.from('pdf'));
  });

  describe('scoping por rol', () => {
    it('OWNER: allowedLocationIds=null (sin restricción), no consulta UserLocationsService', async () => {
      await service.list(TENANT, ownerActor, baseFilters);

      expect(userLocationsService.getActiveUserLocations).not.toHaveBeenCalled();
      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toBeNull();
    });

    it('NOMINA: allowedLocationIds=null (lectura tenant-wide)', async () => {
      await service.list(TENANT, nominaActor, baseFilters);
      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toBeNull();
    });

    it('SUPERVISOR/MANAGER: allowedLocationIds resuelto vía UserLocationsService', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1' } as never,
        { id: 'loc-2' } as never,
      ]);

      await service.list(TENANT, supervisorActor, baseFilters);

      expect(userLocationsService.getActiveUserLocations).toHaveBeenCalledWith(TENANT, 'sup-1');
      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toEqual(['loc-1', 'loc-2']);
    });
  });

  describe('filtro supervisorUserId', () => {
    it('lanza BadRequestException si supervisorUserId no existe en el tenant', async () => {
      repository.findSupervisorUser.mockResolvedValue(null);

      await expect(
        service.list(TENANT, ownerActor, { ...baseFilters, supervisorUserId: 'ghost' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el usuario no tiene rol SUPERVISOR/MANAGER', async () => {
      repository.findSupervisorUser.mockResolvedValue({ id: 'u-1', roleCode: 'OPERATOR' });

      await expect(
        service.list(TENANT, ownerActor, { ...baseFilters, supervisorUserId: 'u-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('caller sin scope (OWNER) + supervisor válido: usa las sedes del supervisor', async () => {
      repository.findSupervisorUser.mockResolvedValue({ id: 'sup-2', roleCode: 'MANAGER' });
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-5' } as never]);

      await service.list(TENANT, ownerActor, { ...baseFilters, supervisorUserId: 'sup-2' });

      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toEqual(['loc-5']);
    });

    it('caller con scope (SUPERVISOR) + supervisor válido: intersecta ambos scopes', async () => {
      repository.findSupervisorUser.mockResolvedValue({ id: 'sup-2', roleCode: 'MANAGER' });
      userLocationsService.getActiveUserLocations
        .mockResolvedValueOnce([{ id: 'loc-1' } as never, { id: 'loc-2' } as never]) // caller scope
        .mockResolvedValueOnce([{ id: 'loc-2' } as never, { id: 'loc-3' } as never]); // supervisor scope

      await service.list(TENANT, supervisorActor, {
        ...baseFilters,
        supervisorUserId: 'sup-2',
      });

      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toEqual(['loc-2']);
    });

    it('intersección vacía se pasa como array vacío (0 filas), nunca se ignora el filtro', async () => {
      repository.findSupervisorUser.mockResolvedValue({ id: 'sup-2', roleCode: 'MANAGER' });
      userLocationsService.getActiveUserLocations
        .mockResolvedValueOnce([{ id: 'loc-1' } as never])
        .mockResolvedValueOnce([{ id: 'loc-9' } as never]);

      await service.list(TENANT, supervisorActor, {
        ...baseFilters,
        supervisorUserId: 'sup-2',
      });

      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toEqual([]);
    });
  });

  describe('paginación', () => {
    it('calcula totalPages a partir del total real devuelto por el repositorio', async () => {
      repository.findPage.mockResolvedValue({
        items: [buildRecord()],
        total: 45,
        activeTotal: 40,
        inactiveTotal: 5,
      });

      const result = await service.list(TENANT, ownerActor, { page: 2, pageSize: 20 });

      expect(result.pagination).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 });
    });

    it('total 0 produce totalPages 1 (nunca 0)', async () => {
      repository.findPage.mockResolvedValue({
        items: [],
        total: 0,
        activeTotal: 0,
        inactiveTotal: 0,
      });

      const result = await service.list(TENANT, ownerActor, baseFilters);

      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('summary', () => {
    it('expone total/active/inactive agregados (no solo la página actual)', async () => {
      repository.findPage.mockResolvedValue({
        items: [buildRecord()],
        total: 45,
        activeTotal: 40,
        inactiveTotal: 5,
      });

      const result = await service.list(TENANT, ownerActor, baseFilters);

      expect(result.summary).toEqual({ total: 45, active: 40, inactive: 5 });
    });
  });

  describe('todayShift', () => {
    it('ASSIGNED: usa el valor batched del repositorio', async () => {
      repository.findTodayAssignments.mockResolvedValue(
        new Map([
          [
            'emp-1',
            {
              type: 'ASSIGNED' as const,
              turno: {
                id: 't-1',
                nombre: 'Mañana',
                sigla: 'TM',
                horaInicio: '06:00',
                horaFin: '14:00',
                jornada: 'DIURNO' as never,
              },
            },
          ],
        ]),
      );

      const result = await service.list(TENANT, ownerActor, baseFilters);
      expect(result.items[0].todayShift.type).toBe('ASSIGNED');
      expect(result.items[0].todayShift.turno?.sigla).toBe('TM');
    });

    it('REST: usa el valor batched del repositorio', async () => {
      repository.findTodayAssignments.mockResolvedValue(
        new Map([['emp-1', { type: 'REST' as const, turno: null }]]),
      );

      const result = await service.list(TENANT, ownerActor, baseFilters);
      expect(result.items[0].todayShift).toEqual({ type: 'REST', turno: null });
    });

    it('sin asignación para hoy: cae a BASE/null (fallback del service)', async () => {
      repository.findTodayAssignments.mockResolvedValue(new Map());

      const result = await service.list(TENANT, ownerActor, baseFilters);
      expect(result.items[0].todayShift).toEqual({ type: 'BASE', turno: null });
    });
  });

  it('portalWorkerEnabled refleja el valor real del repositorio (ya no está fuera de alcance)', async () => {
    repository.findPage.mockResolvedValue({
      items: [buildRecord({ portalWorkerEnabled: true })],
      total: 1,
      activeTotal: 1,
      inactiveTotal: 0,
    });

    const result = await service.list(TENANT, ownerActor, baseFilters);
    expect(result.items[0].portalWorkerEnabled).toBe(true);
  });

  describe('listSupervisorOptions', () => {
    it('resuelve el scope del caller y delega al repositorio', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-1' } as never]);
      repository.findSupervisorOptions.mockResolvedValue([
        { id: 'sup-1', name: 'Sup Uno', email: 'sup1@example.com' },
      ]);

      const result = await service.listSupervisorOptions(TENANT, supervisorActor);

      expect(repository.findSupervisorOptions).toHaveBeenCalledWith(TENANT, ['loc-1']);
      expect(result).toEqual([{ id: 'sup-1', name: 'Sup Uno', email: 'sup1@example.com' }]);
    });

    it('OWNER: pasa allowedLocationIds=null (sin restricción)', async () => {
      await service.listSupervisorOptions(TENANT, ownerActor);
      expect(repository.findSupervisorOptions).toHaveBeenCalledWith(TENANT, null);
    });
  });

  describe('setPortalWorkerEnabled', () => {
    it('actualiza el flag y registra AuditLog con old/new value', async () => {
      repository.findEmployeeForPortalToggle.mockResolvedValue({
        id: 'emp-1',
        portalWorkerEnabled: false,
      });

      const result = await service.setPortalWorkerEnabled(TENANT, 'emp-1', true, 'owner-1');

      expect(repository.updatePortalWorkerEnabled).toHaveBeenCalledWith('emp-1', true);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT,
          action: 'UPDATE',
          entityType: 'EmployeeDetails',
          entityId: 'emp-1',
          actorUserId: 'owner-1',
          oldValue: { portalWorkerEnabled: false },
          newValue: { portalWorkerEnabled: true },
        }),
      );
      expect(result).toEqual({ portalWorkerEnabled: true });
    });

    it('lanza NotFoundException si el colaborador no existe en el tenant', async () => {
      repository.findEmployeeForPortalToggle.mockResolvedValue(null);

      await expect(
        service.setPortalWorkerEnabled(TENANT, 'ghost', true, 'owner-1'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updatePortalWorkerEnabled).not.toHaveBeenCalled();
    });
  });

  describe('getAuditHistory', () => {
    it('valida que el colaborador exista y delega al AuditService', async () => {
      repository.findEmployeeForPortalToggle.mockResolvedValue({
        id: 'emp-1',
        portalWorkerEnabled: false,
      });
      auditService.findRecentByEntity.mockResolvedValue([
        {
          id: 'audit-1',
          action: 'UPDATE',
          actorName: 'owner@example.com',
          createdAt: new Date('2026-07-01'),
          oldValue: { portalWorkerEnabled: false },
          newValue: { portalWorkerEnabled: true },
        },
      ]);

      const result = await service.getAuditHistory(TENANT, 'emp-1');

      expect(auditService.findRecentByEntity).toHaveBeenCalledWith(
        TENANT,
        'EmployeeDetails',
        'emp-1',
      );
      expect(result).toHaveLength(1);
    });

    it('lanza NotFoundException si el colaborador no existe en el tenant', async () => {
      repository.findEmployeeForPortalToggle.mockResolvedValue(null);

      await expect(service.getAuditHistory(TENANT, 'ghost')).rejects.toThrow(NotFoundException);
      expect(auditService.findRecentByEntity).not.toHaveBeenCalled();
    });
  });

  describe('exportFile', () => {
    it('genera Excel reutilizando list() con los mismos filtros y audita EXPORT', async () => {
      const result = await service.exportFile(
        TENANT,
        ownerActor,
        { page: undefined, pageSize: undefined } as never,
        'excel',
        'owner-1',
      );

      expect(excelService.generateXlsx).toHaveBeenCalledTimes(1);
      expect(pdfService.generatePdf).not.toHaveBeenCalled();
      expect(result.filename).toMatch(/^colaboradores_asistencia_\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT',
          payload: expect.objectContaining({ format: 'excel', rowCount: 1 }),
        }),
      );
    });

    it('genera PDF cuando format=pdf', async () => {
      const result = await service.exportFile(TENANT, ownerActor, {} as never, 'pdf', 'owner-1');

      expect(pdfService.generatePdf).toHaveBeenCalledTimes(1);
      expect(excelService.generateXlsx).not.toHaveBeenCalled();
      expect(result.filename).toMatch(/\.pdf$/);
    });

    it('lanza BadRequestException si no hay registros para exportar', async () => {
      repository.findPage.mockResolvedValue({
        items: [],
        total: 0,
        activeTotal: 0,
        inactiveTotal: 0,
      });

      await expect(
        service.exportFile(TENANT, ownerActor, {} as never, 'excel', 'owner-1'),
      ).rejects.toThrow(BadRequestException);
      expect(excelService.generateXlsx).not.toHaveBeenCalled();
    });

    it('respeta el scoping de sede (reutiliza list(), no una query paralela)', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-1' } as never]);

      await service.exportFile(TENANT, supervisorActor, {} as never, 'excel', 'sup-1');

      expect(repository.findPage.mock.calls[0][0].allowedLocationIds).toEqual(['loc-1']);
    });
  });

  describe('emailExport', () => {
    it('genera el archivo, envía el email con adjunto y audita una sola vez', async () => {
      await service.emailExport(
        TENANT,
        ownerActor,
        'owner@example.com',
        { recipients: ['a@example.com', 'b@example.com'], format: 'excel', filters: {} as never },
        'owner-1',
      );

      expect(emailService.send).toHaveBeenCalledTimes(1);
      const sendArgs = emailService.send.mock.calls[0][0];
      expect(sendArgs.to).toEqual(['a@example.com', 'b@example.com']);
      expect(sendArgs.template).toEqual(
        expect.objectContaining({
          type: 'collaborators-export',
          props: expect.objectContaining({ format: 'excel', rowCount: 1 }),
        }),
      );
      expect(sendArgs.attachments).toHaveLength(1);
      expect(sendArgs.attachments?.[0].filename).toMatch(/\.xlsx$/);

      expect(auditService.log).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT',
          payload: expect.objectContaining({
            recipients: ['a@example.com', 'b@example.com'],
            format: 'excel',
            rowCount: 1,
          }),
        }),
      );
    });

    it('lanza BadRequestException si no hay registros (no envía email)', async () => {
      repository.findPage.mockResolvedValue({
        items: [],
        total: 0,
        activeTotal: 0,
        inactiveTotal: 0,
      });

      await expect(
        service.emailExport(
          TENANT,
          ownerActor,
          'owner@example.com',
          { recipients: ['a@example.com'], format: 'excel', filters: {} as never },
          'owner-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });
});
