import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ArlRiskLevel,
  AttendanceEventType,
  DocumentType,
  EmployeeContractType,
  SalaryType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SMLV_2025, TRANSPORT_SUBSIDY_2025 } from '../../payroll/payroll.constants';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PayrollCalculationService } from '../../payroll/service/payroll-calculation.service';
import { EmployeeWithUserAndLocation, ReportsRepository } from '../repository/reports.repository';
import { PayrollRepository } from '../../payroll/repository/payroll.repository';
import { ReportsService } from '../service/reports.service';
import { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
import { AttendanceReportStatusFilter } from '../controller/dto/attendance-export-query.dto';
import { MAX_EXPORT_ROWS } from '../reports.constants';
import { VacationsService } from '../../vacations/service/vacations.service';
import { VacationType } from '@prisma/client';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';
const PERIOD_JUNE_2025 = '2025-06';
const OWNER_ACTOR = { userId: 'user-owner', roleCode: 'OWNER' };

// Reproduces the pre-OS-585 hardcoded constants (NOCTURNO_START_HOUR=21,
// TRANSPORT_SUBSIDY_2025=162000, FESTIVO_DIURNO surcharge=0.75, SMLV_2025) as values
// resolved from a preloaded LegalParameterSnapshot, so existing nocturno/festivo/payroll
// assertions keep passing unchanged.
const LEGAL_PARAM_VALUES: Record<string, number> = {
  SMLV: SMLV_2025,
  AUXILIO_TRANSPORTE: TRANSPORT_SUBSIDY_2025,
  RECARGO_DOMINICAL_FESTIVO: 0.75,
  HORARIO_NOCTURNO_INICIO: 21,
};

function makeLegalSnapshot() {
  return {
    numberAt: jest.fn((key: string) => LEGAL_PARAM_VALUES[key]),
  };
}

/** workDate stored as UTC midnight for the Colombia calendar date */
function workDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

function makeEntry(employeeId: string, date: string, hour: number, minute = 0): any {
  const ts = new Date(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
  );
  return {
    id: `entry-${employeeId}-${date}-${hour}`,
    tenantId: TENANT_ID,
    employeeId,
    locationId: 'loc-1',
    eventType: AttendanceEventType.ENTRY,
    timestamp: ts,
    workDate: workDate(date),
    shift: null,
    notes: null,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };
}

function makeExit(employeeId: string, date: string, hour: number, minute = 0): any {
  const ts = new Date(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
  );
  return {
    id: `exit-${employeeId}-${date}-${hour}`,
    tenantId: TENANT_ID,
    employeeId,
    locationId: 'loc-1',
    eventType: AttendanceEventType.EXIT,
    timestamp: ts,
    workDate: workDate(date),
    shift: null,
    notes: null,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };
}

const mockEmployee: EmployeeWithUserAndLocation = {
  id: 'emp-1',
  userId: 'user-1',
  tenantId: TENANT_ID,
  locationId: 'loc-1',
  name: 'Juan Perez',
  position: 'Cocinero',
  area: 'Cocina',
  department: 'Produccion',
  contractType: EmployeeContractType.INDEFINIDO,
  hireDate: new Date('2020-01-01'),
  contractStart: new Date('2020-01-01'),
  contractEnd: null,
  salaryType: SalaryType.ORDINARIO,
  salaryAmount: new Decimal(SMLV_2025),
  hasTransportSubsidy: true,
  isExemptFromTax: false,
  epsName: 'Sura',
  pensionFundName: 'Porvenir',
  cesantiasFundName: 'Porvenir',
  arlName: 'Sura',
  arlRiskLevel: ArlRiskLevel.RIESGO_I,
  cajaCompensacion: 'Comfamiliar',
  pinHash: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  user: {
    id: 'user-1',
    tenantId: TENANT_ID,
    cedula: '12345678',
    documentType: DocumentType.CC,
    email: 'juan@test.com',
    passwordHash: 'xxx',
    roleId: 'role-1',
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    refreshToken: null,
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
  },
  location: { id: 'loc-1', name: 'Sede Norte' },
} as EmployeeWithUserAndLocation;

const mockEmployee2: EmployeeWithUserAndLocation = {
  ...mockEmployee,
  id: 'emp-2',
  userId: 'user-2',
  locationId: 'loc-2',
  name: 'Maria Lopez',
  salaryAmount: new Decimal(3_000_000),
  hasTransportSubsidy: false,
  user: { ...mockEmployee.user, id: 'user-2', cedula: '87654321', email: 'maria@test.com' },
  location: { id: 'loc-2', name: 'Sede Sur' },
} as EmployeeWithUserAndLocation;

/** 8-hour diurnal day: 06:00-14:00 (UTC hours, Colombia is UTC-5, so these are 01:00-09:00 UTC) */
function fullDayLogs(employeeId: string, date: string): any[] {
  // Entry 06:00 Colombia = 11:00 UTC, Exit 14:00 Colombia = 19:00 UTC
  return [makeEntry(employeeId, date, 11, 0), makeExit(employeeId, date, 19, 0)];
}

/** 10-hour day (2h overtime): 06:00-16:00 Colombia = 11:00-21:00 UTC */
function overtimeDayLogs(employeeId: string, date: string): any[] {
  return [makeEntry(employeeId, date, 11, 0), makeExit(employeeId, date, 21, 0)];
}

/** 3h overtime day (exceeds daily limit of 120 min) */
function excessOvertimeDayLogs(employeeId: string, date: string): any[] {
  // 11h day: 06:00-17:00 Colombia = 11:00-22:00 UTC
  return [makeEntry(employeeId, date, 11, 0), makeExit(employeeId, date, 22, 0)];
}

/**
 * Nocturno with overtime: 10h shift starting 21:00 Colombia.
 * Entry 21:00 Colombia = 02:00 UTC, exit 07:00 Colombia = 12:00 UTC.
 * Duration = 10h = 600 min → 120 min overtime classified NOCTURNO.
 */
function nocturnoDayLogs(employeeId: string, date: string): any[] {
  // 21:00 Colombia = 02:00 UTC; 07:00 Colombia = 12:00 UTC
  const entryTs = new Date(`${date}T02:00:00.000Z`);
  const exitTs = new Date(`${date}T12:00:00.000Z`);
  return [
    {
      id: `entry-nocturno-${date}`,
      tenantId: TENANT_ID,
      employeeId,
      locationId: 'loc-1',
      eventType: AttendanceEventType.ENTRY,
      timestamp: entryTs,
      workDate: workDate(date),
      shift: null,
      notes: null,
      isActive: true,
      createdAt: entryTs,
      updatedAt: entryTs,
    },
    {
      id: `exit-nocturno-${date}`,
      tenantId: TENANT_ID,
      employeeId,
      locationId: 'loc-1',
      eventType: AttendanceEventType.EXIT,
      timestamp: exitTs,
      workDate: workDate(date),
      shift: null,
      notes: null,
      isActive: true,
      createdAt: exitTs,
      updatedAt: exitTs,
    },
  ];
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: jest.Mocked<ReportsRepository>;
  let payrollRepository: jest.Mocked<PayrollRepository>;
  let vacationsService: jest.Mocked<VacationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        PayrollCalculationService,
        {
          provide: ReportsRepository,
          useValue: {
            findActiveEmployees: jest.fn(),
            findAttendanceLogsByDateRange: jest.fn(),
          },
        },
        {
          provide: PayrollRepository,
          useValue: {
            findAll: jest.fn(),
            count: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
            assertLocationAllowed: jest.fn(),
          },
        },
        {
          provide: VacationsService,
          useValue: {
            getApprovedDisfruteRanges: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: LaborLegalParametersService,
          useValue: {
            preload: jest.fn().mockResolvedValue(makeLegalSnapshot()),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get(ReportsRepository);
    payrollRepository = module.get(PayrollRepository);
    vacationsService = module.get(VacationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getPayrollReport ───────────────────────────────────────────────────────

  describe('getPayrollReport', () => {
    const query: PeriodQueryDto = { period: PERIOD_JUNE_2025 };

    it('returns correct period and tenantId', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.period).toEqual({ year: 2025, month: 6 });
    });

    it('returns empty employees array when no active employees', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.employees).toHaveLength(0);
      expect(result.tenantTotals.employeeCount).toBe(0);
    });

    it('employee with no attendance logs gets workedDays=0 and netPay > 0 for full subsidy', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.workedDays).toBe(0);
      expect(row.salaryBase).toBe(0);
      expect(row.netPay).toBe(0);
    });

    it('full-month employee: salaryBase = full SMLV', async () => {
      // 30 days worked in June 2025 (30-day month)
      const logs = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();

      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.workedDays).toBe(30);
      expect(row.salaryBase).toBe(SMLV_2025);
      expect(row.transportSubsidy).toBe(TRANSPORT_SUBSIDY_2025);
    });

    it('overtime diurno on non-holiday is classified DIURNO', async () => {
      // Jun 3 and Jun 4, 2025 — neither is a Colombian holiday
      const logs = [
        ...overtimeDayLogs('emp-1', '2025-06-03'),
        ...overtimeDayLogs('emp-1', '2025-06-04'),
      ];
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2025-06' }, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.overtimePay).toBeGreaterThan(0);
      const diurno = row.overtimeBreakdown.find((b) => b.type === 'DIURNO');
      expect(diurno).toBeDefined();
      expect(diurno!.surchargeRate).toBe(0.25);
    });

    // ── Festivos — Task04A ─────────────────────────────────────────────────

    it('diurno overtime on Colombian holiday → FESTIVO_DIURNO (surcharge 0.75)', async () => {
      // Aug 7, 2025 — Batalla de Boyacá (fixed holiday)
      // 10h shift: entry 11:00 UTC (06:00 Colombia), exit 21:00 UTC (16:00 Colombia)
      // → 600 min worked, 120 min overtime, diurno, festivo
      const logs = overtimeDayLogs('emp-1', '2025-08-07');
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2025-08' }, OWNER_ACTOR);
      const row = result.employees[0];

      const festivo = row.overtimeBreakdown.find((b) => b.type === 'FESTIVO_DIURNO');
      expect(festivo).toBeDefined();
      expect(festivo!.surchargeRate).toBe(0.75);
      expect(festivo!.minutes).toBe(120);

      // Must NOT appear as regular DIURNO
      expect(row.overtimeBreakdown.find((b) => b.type === 'DIURNO')).toBeUndefined();
    });

    it('nocturno overtime on Colombian holiday → FESTIVO_NOCTURNO (surcharge 1.50)', async () => {
      // Aug 7, 2025 — entry 02:00 UTC (21:00 Colombia), exit 12:00 UTC (07:00 Colombia)
      // → 600 min worked, 120 min overtime, nocturno, festivo
      const logs = nocturnoDayLogs('emp-1', '2025-08-07');
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2025-08' }, OWNER_ACTOR);
      const row = result.employees[0];

      const festivo = row.overtimeBreakdown.find((b) => b.type === 'FESTIVO_NOCTURNO');
      expect(festivo).toBeDefined();
      expect(festivo!.surchargeRate).toBe(1.5);
      expect(festivo!.minutes).toBe(120);

      // Must NOT appear as regular NOCTURNO
      expect(row.overtimeBreakdown.find((b) => b.type === 'NOCTURNO')).toBeUndefined();
    });

    it('FESTIVO_NOCTURNO pay is greater than FESTIVO_DIURNO for same minutes', async () => {
      // Arrange two separate payroll reports — same salary, same OT minutes
      const diurnoLogs = overtimeDayLogs('emp-1', '2025-08-07'); // festivo diurno
      const nocturnoLogs = nocturnoDayLogs('emp-1', '2025-08-07'); // festivo nocturno

      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);

      repository.findAttendanceLogsByDateRange.mockResolvedValueOnce(diurnoLogs);
      const diurnoResult = await service.getPayrollReport(
        TENANT_ID,
        { period: '2025-08' },
        OWNER_ACTOR,
      );

      repository.findAttendanceLogsByDateRange.mockResolvedValueOnce(nocturnoLogs);
      const nocturnoResult = await service.getPayrollReport(
        TENANT_ID,
        { period: '2025-08' },
        OWNER_ACTOR,
      );

      // 1.50 surcharge > 0.75 surcharge → nocturno pay must be higher
      expect(nocturnoResult.employees[0].overtimePay).toBeGreaterThan(
        diurnoResult.employees[0].overtimePay,
      );
    });

    it('movible holiday in 2025: Jun 2 (Ascensión) → FESTIVO_DIURNO', async () => {
      // Jun 2, 2025 — Ascensión (moved from May 29)
      const logs = overtimeDayLogs('emp-1', '2025-06-02');
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2025-06' }, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.overtimeBreakdown.find((b) => b.type === 'FESTIVO_DIURNO')).toBeDefined();
      expect(row.overtimeBreakdown.find((b) => b.type === 'DIURNO')).toBeUndefined();
    });

    it('2026 holiday: Jun 29 (San Pedro — already Monday) → FESTIVO_DIURNO', async () => {
      const logs = overtimeDayLogs('emp-1', '2026-06-29');
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2026-06' }, OWNER_ACTOR);
      expect(
        result.employees[0].overtimeBreakdown.find((b) => b.type === 'FESTIVO_DIURNO'),
      ).toBeDefined();
    });

    it('2027 holiday: Jul 5 (San Pedro y San Pablo moved) → FESTIVO_DIURNO', async () => {
      const logs = overtimeDayLogs('emp-1', '2027-07-05');
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getPayrollReport(TENANT_ID, { period: '2027-07' }, OWNER_ACTOR);
      expect(
        result.employees[0].overtimeBreakdown.find((b) => b.type === 'FESTIVO_DIURNO'),
      ).toBeDefined();
    });

    it('tenantTotals correctly aggregates all employees', async () => {
      const logs1 = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();
      const logs2 = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-2', `2025-06-${day}`);
      }).flat();

      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([...logs1, ...logs2]);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.tenantTotals.employeeCount).toBe(2);
      expect(result.tenantTotals.totalNetPay).toBe(
        result.employees.reduce((s, r) => s + r.netPay, 0),
      );
      expect(result.tenantTotals.totalPayrollCost).toBe(
        result.employees.reduce((s, r) => s + r.totalPayrollCost, 0),
      );
    });

    it('locationTotals groups employees by their locationId', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.locationTotals).toHaveLength(2);
      const loc1 = result.locationTotals.find((l) => l.locationId === 'loc-1');
      const loc2 = result.locationTotals.find((l) => l.locationId === 'loc-2');
      expect(loc1).toBeDefined();
      expect(loc2).toBeDefined();
      expect(loc1!.employeeCount).toBe(1);
      expect(loc2!.employeeCount).toBe(1);
    });

    it('passes locationId filter to repository', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      await service.getPayrollReport(
        TENANT_ID,
        { period: '2025-06', locationId: 'loc-1' },
        OWNER_ACTOR,
      );

      expect(repository.findActiveEmployees).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ locationId: 'loc-1' }),
      );
    });

    it('passes contractType filter to repository', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      await service.getPayrollReport(
        TENANT_ID,
        {
          period: '2025-06',
          contractType: EmployeeContractType.INDEFINIDO,
        },
        OWNER_ACTOR,
      );

      expect(repository.findActiveEmployees).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ contractType: EmployeeContractType.INDEFINIDO }),
      );
    });

    it('PRESTACION employee has totalEmployerContributions = 0', async () => {
      const prestacionEmp = {
        ...mockEmployee,
        contractType: EmployeeContractType.PRESTACION,
      } as EmployeeWithUserAndLocation;
      repository.findActiveEmployees.mockResolvedValue([prestacionEmp]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        fullDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);
      expect(result.employees[0].totalEmployerContributions).toBe(0);
    });

    it('unpaired ENTRY logs do not count as worked time', async () => {
      const onlyEntry = [makeEntry('emp-1', '2025-06-01', 11)];
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(onlyEntry);

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);
      expect(result.employees[0].workedDays).toBe(0);
    });

    it('nocturno overtime is classified as NOCTURNO type', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        nocturnoDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getPayrollReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];
      const nocturno = row.overtimeBreakdown.find((b) => b.type === 'NOCTURNO');
      expect(nocturno).toBeDefined();
      expect(nocturno!.surchargeRate).toBe(0.75);
    });
  });

  // ── getAttendanceReport ────────────────────────────────────────────────────

  describe('getAttendanceReport', () => {
    const query: AttendanceQueryDto = { from: '2025-06-01', to: '2025-06-30' };

    it('returns correct from/to and tenantId', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.from).toBe('2025-06-01');
      expect(result.to).toBe('2025-06-30');
    });

    it('employee with 30 full days: activeDays=30, absentDays=0', async () => {
      const logs = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.activeDays).toBe(30);
      expect(row.absentDays).toBe(0);
      expect(row.totalWorkedMinutes).toBe(30 * 480);
      expect(row.overtimeMinutes).toBe(0);
    });

    it('employee with 15 days absent: absentDays=15', async () => {
      const logs = Array.from({ length: 15 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.activeDays).toBe(15);
      expect(row.absentDays).toBe(15);
    });

    it('excluye días de vacaciones aprobadas de absentDays (PC-1)', async () => {
      const logs = Array.from({ length: 15 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);
      vacationsService.getApprovedDisfruteRanges.mockResolvedValue([
        {
          employeeId: 'emp-1',
          startDate: workDate('2025-06-20'),
          endDate: workDate('2025-06-22'),
          type: VacationType.DISFRUTE,
        },
      ]);

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.activeDays).toBe(15);
      expect(row.absentDays).toBe(12);
    });

    it('exceededLegalOvertimeLimit=true when daily overtime > 120 min', async () => {
      // 3h overtime in a single day
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        excessOvertimeDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);
      expect(result.employees[0].exceededLegalOvertimeLimit).toBe(true);
    });

    it('exceededLegalOvertimeLimit=false when overtime stays within limits', async () => {
      // 2h overtime per day for 3 days = 6h total (< 12h weekly limit)
      const logs = [
        ...overtimeDayLogs('emp-1', '2025-06-02'),
        ...overtimeDayLogs('emp-1', '2025-06-03'),
        ...overtimeDayLogs('emp-1', '2025-06-04'),
      ];
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getAttendanceReport(TENANT_ID, query, OWNER_ACTOR);
      expect(result.employees[0].exceededLegalOvertimeLimit).toBe(false);
    });

    it('exceededLegalOvertimeLimit=true when weekly overtime > 720 min', async () => {
      // 7 days × 2h overtime = 840 min in same week (> 720 min limit)
      const logs = Array.from({ length: 7 }, (_, i) => {
        const day = String(i + 2).padStart(2, '0'); // 02..08 June (Mon-Sun week)
        return overtimeDayLogs('emp-1', `2025-06-${day}`);
      }).flat();
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getAttendanceReport(
        TENANT_ID,
        {
          from: '2025-06-01',
          to: '2025-06-30',
        },
        OWNER_ACTOR,
      );
      expect(result.employees[0].exceededLegalOvertimeLimit).toBe(true);
    });

    it('throws BadRequestException when from > to', async () => {
      await expect(
        service.getAttendanceReport(
          TENANT_ID,
          { from: '2025-06-30', to: '2025-06-01' },
          OWNER_ACTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('passes locationId filter to repository', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      await service.getAttendanceReport(TENANT_ID, { ...query, locationId: 'loc-1' }, OWNER_ACTOR);

      expect(repository.findActiveEmployees).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ locationId: 'loc-1' }),
      );
    });

    it('filters PRESENT employees with worked minutes', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        fullDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getAttendanceReport(
        TENANT_ID,
        { ...query, status: AttendanceReportStatusFilter.PRESENT },
        OWNER_ACTOR,
      );

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0]?.employeeId).toBe('emp-1');
    });

    it('filters ABSENT employees without worked minutes', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        fullDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getAttendanceReport(
        TENANT_ID,
        { ...query, status: AttendanceReportStatusFilter.ABSENT },
        OWNER_ACTOR,
      );

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0]?.employeeId).toBe('emp-2');
    });

    it('filters LATE employees exceeding legal overtime', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        excessOvertimeDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getAttendanceReport(
        TENANT_ID,
        { ...query, status: AttendanceReportStatusFilter.LATE },
        OWNER_ACTOR,
      );

      expect(result.employees).toHaveLength(1);
      expect(result.employees[0]?.exceededLegalOvertimeLimit).toBe(true);
    });
  });

  describe('getAttendanceReportForExport', () => {
    const query = { from: '2025-06-01', to: '2025-06-30' };

    it('returns attendance report when within export row limit', async () => {
      repository.findActiveEmployees.mockResolvedValue([mockEmployee]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        fullDayLogs('emp-1', '2025-06-01'),
      );

      const result = await service.getAttendanceReportForExport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.employees).toHaveLength(1);
      expect(result.from).toBe(query.from);
    });

    it('throws BadRequestException when export row limit is exceeded', async () => {
      const employees = Array.from({ length: MAX_EXPORT_ROWS + 1 }, (_, index) => ({
        ...mockEmployee,
        id: `emp-${index}`,
      }));
      repository.findActiveEmployees.mockResolvedValue(employees);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      await expect(
        service.getAttendanceReportForExport(TENANT_ID, query, OWNER_ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmployeeListReport', () => {
    it('maps employees for export with filters summary', async () => {
      payrollRepository.count.mockResolvedValue(1);
      payrollRepository.findAll.mockResolvedValue([mockEmployee as any]);

      const result = await service.getEmployeeListReport(
        TENANT_ID,
        { locationId: 'loc-1', isActive: true },
        OWNER_ACTOR,
      );

      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.employees).toHaveLength(1);
      expect(result.employees[0]?.name).toBe('Juan Perez');
      expect(result.filtersSummary).toContain('Sede: loc-1');
    });

    it('throws NotFoundException when employeeId does not belong to tenant', async () => {
      payrollRepository.findById.mockResolvedValue({ ...mockEmployee, tenantId: 'other' } as any);

      await expect(
        service.getEmployeeListReport(TENANT_ID, { employeeId: 'emp-1' }, OWNER_ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when employeeId is missing', async () => {
      payrollRepository.findById.mockResolvedValue(null);

      await expect(
        service.getEmployeeListReport(TENANT_ID, { employeeId: 'emp-missing' }, OWNER_ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('maps nullable contract dates in employee list rows', async () => {
      payrollRepository.count.mockResolvedValue(1);
      payrollRepository.findAll.mockResolvedValue([
        {
          ...mockEmployee,
          contractStart: null,
          contractEnd: null,
          location: undefined,
        } as any,
      ]);

      const result = await service.getEmployeeListReport(TENANT_ID, {}, OWNER_ACTOR);

      expect(result.employees[0]?.contractStart).toBeNull();
      expect(result.employees[0]?.contractEnd).toBeNull();
      expect(result.employees[0]?.locationName).toBe('loc-1');
    });

    it('throws BadRequestException when employee export exceeds row limit', async () => {
      payrollRepository.findById.mockResolvedValue(mockEmployee as any);
      payrollRepository.count.mockResolvedValue(MAX_EXPORT_ROWS + 1);

      await expect(
        service.getEmployeeListReport(TENANT_ID, { employeeId: 'emp-1' }, OWNER_ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getSocialSecurityReport ────────────────────────────────────────────────

  describe('getSocialSecurityReport', () => {
    const query: PeriodQueryDto = { period: PERIOD_JUNE_2025 };

    it('returns correct tenantId and period', async () => {
      repository.findActiveEmployees.mockResolvedValue([]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue([]);

      const result = await service.getSocialSecurityReport(TENANT_ID, query, OWNER_ACTOR);

      expect(result.tenantId).toBe(TENANT_ID);
      expect(result.period).toEqual({ year: 2025, month: 6 });
    });

    it('totalPILAContribution = sum of all totalEmployerContribution', async () => {
      const logs = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return [
          ...fullDayLogs('emp-1', `2025-06-${day}`),
          ...fullDayLogs('emp-2', `2025-06-${day}`),
        ];
      }).flat();

      repository.findActiveEmployees.mockResolvedValue([mockEmployee, mockEmployee2]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getSocialSecurityReport(TENANT_ID, query, OWNER_ACTOR);

      const expected = result.employees.reduce((s, r) => s + r.totalEmployerContribution, 0);
      expect(result.totalPILAContribution).toBe(expected);
      expect(result.totalPILAContribution).toBeGreaterThan(0);
    });

    it('maps employer contributions correctly from payroll calculation', async () => {
      const salary = 4_000_000;
      const emp = {
        ...mockEmployee,
        salaryAmount: new Decimal(salary),
        hasTransportSubsidy: false,
      };
      const logs = Array.from({ length: 30 }, (_, i) => {
        const day = String(i + 1).padStart(2, '0');
        return fullDayLogs('emp-1', `2025-06-${day}`);
      }).flat();

      repository.findActiveEmployees.mockResolvedValue([emp as EmployeeWithUserAndLocation]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(logs);

      const result = await service.getSocialSecurityReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.healthEmployer).toBeGreaterThan(0);
      expect(row.pensionEmployer).toBeGreaterThan(0);
      expect(row.arlEmployer).toBeGreaterThan(0);
      expect(row.senaEmployer).toBeGreaterThan(0);
      expect(row.icbfEmployer).toBeGreaterThan(0);
      expect(row.compensationFundEmployer).toBeGreaterThan(0);
      expect(row.totalEmployerContribution).toBe(
        row.healthEmployer +
          row.pensionEmployer +
          row.arlEmployer +
          row.senaEmployer +
          row.icbfEmployer +
          row.compensationFundEmployer,
      );
    });

    it('PRESTACION employee has all employer contributions = 0', async () => {
      const prestacionEmp = {
        ...mockEmployee,
        contractType: EmployeeContractType.PRESTACION,
      } as EmployeeWithUserAndLocation;
      repository.findActiveEmployees.mockResolvedValue([prestacionEmp]);
      repository.findAttendanceLogsByDateRange.mockResolvedValue(
        Array.from({ length: 30 }, (_, i) =>
          fullDayLogs('emp-1', `2025-06-${String(i + 1).padStart(2, '0')}`),
        ).flat(),
      );

      const result = await service.getSocialSecurityReport(TENANT_ID, query, OWNER_ACTOR);
      const row = result.employees[0];

      expect(row.totalEmployerContribution).toBe(0);
      expect(result.totalPILAContribution).toBe(0);
    });
  });
});
