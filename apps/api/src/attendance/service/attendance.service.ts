import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLog,
  AttendanceLogSource,
  AttendanceShift,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ATTENDANCE_DUPLICATE_WINDOW_MS,
  KIOSK_LOCK_DURATION_MS,
  KIOSK_MAX_ATTEMPTS,
  SHIFT_AFTERNOON_END,
  SHIFT_AFTERNOON_START,
  SHIFT_MORNING_START,
  SHIFT_WINDOW_TOLERANCE_MINUTES,
} from '../attendance.constants';
import type {
  ActiveAttendanceEntry,
  AttendanceActingUser,
  AttendanceLogFull,
  EntryResult,
  ExitResult,
  IAttendanceService,
  KioskAuthInput,
  KioskAuthResult,
  ListHistoryInput,
  OvertimeSummary,
  RegisterEntryInput,
  RegisterExitInput,
  RegisterEventInput,
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository, normalizeWorkDate } from '../repository/attendance.repository';
import { MobileAttendanceRepository } from '../mobile/repository/mobile-attendance.repository';
import {
  calculateDaySummary,
  getBogotaHour,
  isTimestampWithinShiftWindow,
} from '../utils/attendance-calculation.util';
import { validateGeofence } from '../utils/attendance-geofence.util';
import { AuthService } from '../../auth/service/auth.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import { assertNotOnApprovedVacation } from './vacation-attendance.guard';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { OvertimeDetectionService } from '../../overtime/service/overtime-detection.service';

// Kiosk-auth security model:
//   • Tenant scope: tenantId required on every call
//   • Location scope: employee must belong to the locationId provided
//   • bcrypt PIN comparison (SALT_ROUNDS=12)
//   • Lockout: 3 failed attempts → 15 min block keyed by EmployeeDetails.id
//
// GAP — lockout in-memory: resets on process restart. EmployeeDetails has no
// loginAttempts/lockedUntil fields (schema closed NOM-03). Persistence requires
// a migration adding those columns — tracked for NOM-04 hardening.
const kioskLockout = new Map<string, { attempts: number; lockedUntil: Date | null }>();

@Injectable()
export class AttendanceService implements IAttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly mobileAttendanceRepository: MobileAttendanceRepository,
    private readonly authService: AuthService,
    private readonly shiftResolutionService: ShiftResolutionService,
    private readonly userLocationsService: UserLocationsService,
    private readonly legalParametersService: LaborLegalParametersService,
    @Optional() private readonly vacationsService?: VacationsService,
    @Optional() private readonly overtimeDetectionService?: OvertimeDetectionService,
  ) {}

  async kioskAuth(dto: KioskAuthInput, tenantId: string): Promise<KioskAuthResult> {
    const user = await this.attendanceRepository.findUserByCedula(dto.cedula, tenantId);
    if (!user) {
      throw new UnauthorizedException('Cédula o PIN incorrecto');
    }

    const employee = await this.attendanceRepository.findEmployeeByUserId(user.id, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    if (!employee.pinHash) {
      throw new UnprocessableEntityException('PIN no configurado para este empleado');
    }

    const lockKey = employee.id;
    const lock = kioskLockout.get(lockKey);

    if (lock?.lockedUntil && lock.lockedUntil > new Date()) {
      const remainingSecs = Math.ceil((lock.lockedUntil.getTime() - Date.now()) / 1000);
      throw new ForbiddenException(`Cuenta bloqueada. Intenta en ${remainingSecs} segundos`);
    }

    const pinMatch = await bcrypt.compare(dto.pin, employee.pinHash);
    if (!pinMatch) {
      this.incrementLockout(lockKey);
      throw new UnauthorizedException('Cédula o PIN incorrecto');
    }

    kioskLockout.delete(lockKey);

    const fullName = user.email.split('@')[0];
    const tokens = await this.authService.issueKioskAuthTokens(
      user.id,
      tenantId,
      employee.locationId,
    );
    this.logger.log(`Kiosk auth OK: employeeId=${employee.id} tenantId=${tenantId}`);

    return {
      userId: user.id,
      fullName,
      locationId: employee.locationId,
      employeeId: employee.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async registerEntry(dto: RegisterEntryInput, tenantId: string): Promise<EntryResult> {
    const employee = await this.attendanceRepository.findEmployeeByUserAndLocation(
      dto.userId,
      dto.locationId,
      tenantId,
    );
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado en esta sede');
    }

    const openEntry = await this.attendanceRepository.findOpenEntry(employee.id);
    if (openEntry) {
      throw new ConflictException('Ya existe una entrada activa sin salida registrada');
    }

    const now = new Date();
    const workDate = normalizeWorkDate(now);
    await assertNotOnApprovedVacation(this.vacationsService, tenantId, employee.id, workDate);
    const shift = detectShift(now);

    const log = await this.attendanceRepository.create({
      tenantId,
      employeeId: employee.id,
      locationId: dto.locationId,
      eventType: AttendanceEventType.ENTRY,
      shift,
      workDate,
      notes: dto.notes ?? null,
    });

    this.logger.log(`ENTRY: employeeId=${employee.id} workDate=${workDate.toISOString()}`);

    return {
      logId: log.id,
      employeeId: employee.id,
      userId: dto.userId,
      workDate: log.workDate,
      timestamp: log.timestamp,
      shift: log.shift,
    };
  }

  async registerExit(dto: RegisterExitInput, tenantId: string): Promise<ExitResult> {
    const employee = await this.attendanceRepository.findEmployeeByUserAndLocation(
      dto.userId,
      dto.locationId,
      tenantId,
    );
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado en esta sede');
    }

    const openEntry = await this.attendanceRepository.findOpenEntry(employee.id);
    if (!openEntry) {
      throw new BadRequestException('No hay entrada activa para registrar la salida');
    }

    const now = new Date();
    await assertNotOnApprovedVacation(
      this.vacationsService,
      tenantId,
      employee.id,
      openEntry.workDate,
    );

    const log = await this.attendanceRepository.create({
      tenantId,
      employeeId: employee.id,
      locationId: dto.locationId,
      eventType: AttendanceEventType.EXIT,
      shift: openEntry.shift,
      workDate: openEntry.workDate,
      notes: dto.notes ?? null,
    });

    const allLogsForDay = await this.attendanceRepository.findAllForDay(
      employee.id,
      openEntry.workDate,
    );

    const nocturnoStartHour = await this.legalParametersService.getValueAt(
      'HORARIO_NOCTURNO_INICIO',
      now,
      tenantId,
    );
    const summary = calculateDaySummary(allLogsForDay, now, nocturnoStartHour);

    this.logger.log(
      `EXIT: employeeId=${employee.id} workDate=${openEntry.workDate.toISOString()} totalMin=${summary.totalMinutes}`,
    );

    this.triggerOvertimeDetection({
      tenantId,
      employeeId: employee.id,
      locationId: dto.locationId,
      workDate: log.workDate,
      actualEndTime: log.timestamp,
    });

    return {
      logId: log.id,
      employeeId: employee.id,
      userId: dto.userId,
      workDate: log.workDate,
      timestamp: log.timestamp,
      totalMinutes: summary.totalMinutes,
      overtimeMinutes: summary.overtimeMinutes,
      isNocturno: summary.isNocturno,
    };
  }

  async registerEvent(input: RegisterEventInput): Promise<AttendanceLog> {
    const duplicate = await this.attendanceRepository.findDuplicateEvent({
      employeeId: input.employeeId,
      eventType: input.eventType,
      source: input.source,
      timestamp: input.timestamp,
      windowMs: ATTENDANCE_DUPLICATE_WINDOW_MS,
    });
    if (duplicate) {
      throw new ConflictException('Marcación duplicada');
    }

    let workDate = input.workDate ?? normalizeWorkDate(input.timestamp);
    let shift = input.shift ?? null;

    if (input.source === AttendanceLogSource.APP_MOVIL) {
      if (input.eventType === AttendanceEventType.ENTRY) {
        const openEntry = await this.attendanceRepository.findOpenEntry(input.employeeId);
        if (openEntry) {
          throw new ConflictException('Ya existe una entrada activa sin salida registrada');
        }
        shift = shift ?? detectShift(input.timestamp);
      } else {
        const openEntry = await this.attendanceRepository.findOpenEntry(input.employeeId);
        if (!openEntry) {
          throw new BadRequestException('No hay entrada activa para registrar la salida');
        }
        workDate = openEntry.workDate;
        shift = openEntry.shift;
      }
    } else if (input.source === AttendanceLogSource.MANUAL) {
      shift = shift ?? detectShift(input.timestamp);
      await this.assertManualMarkingWithinAssignedShift(input, workDate);
    }

    await assertNotOnApprovedVacation(
      this.vacationsService,
      input.tenantId,
      input.employeeId,
      workDate,
    );

    let validationStatus = null;
    let distanceMeters: number | null = null;
    let radiusMeters: number | null = null;
    let rejectionReason: string | null = null;

    if (
      input.source === AttendanceLogSource.APP_MOVIL &&
      input.clientLatitude != null &&
      input.clientLongitude != null
    ) {
      const location = await this.attendanceRepository.findLocationById(
        input.locationId,
        input.tenantId,
      );
      if (!location) {
        throw new NotFoundException(`Sede ${input.locationId} no encontrada`);
      }

      const geo = validateGeofence(
        input.clientLatitude,
        input.clientLongitude,
        location.geoLatitude,
        location.geoLongitude,
        location.checkInRadiusMeters,
      );
      validationStatus = geo.validationStatus;
      distanceMeters = geo.distanceMeters;
      radiusMeters = geo.radiusMeters;
      rejectionReason = geo.rejectionReason;
    }

    const persistPayload = {
      ...input,
      workDate,
      shift,
      validationStatus,
      distanceMeters,
      radiusMeters,
      rejectionReason,
    };

    const log =
      input.source === AttendanceLogSource.APP_MOVIL
        ? await this.mobileAttendanceRepository.create(persistPayload)
        : await this.attendanceRepository.createEventLog(persistPayload);

    this.logger.log(
      `EVENT ${input.eventType} source=${input.source}: employeeId=${input.employeeId} workDate=${workDate.toISOString()}`,
    );

    if (input.eventType === AttendanceEventType.EXIT) {
      this.triggerOvertimeDetection({
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        locationId: input.locationId,
        workDate: log.workDate,
        actualEndTime: log.timestamp,
      });
    }

    return log;
  }

  private triggerOvertimeDetection(payload: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
    actualEndTime: Date;
  }): void {
    if (!this.overtimeDetectionService) return;

    void this.overtimeDetectionService.onExitRegistered(payload).catch((err: unknown) => {
      this.logger.warn(`Overtime detection failed: ${String(err)}`);
    });
  }

  async listHistory(
    query: ListHistoryInput,
    tenantId: string,
    actor: AttendanceActingUser,
  ): Promise<AttendanceLogFull[]> {
    let employeeId: string | undefined;

    if (query.userId) {
      const employee = await this.attendanceRepository.findEmployeeByUserId(query.userId, tenantId);
      if (!employee) {
        throw new NotFoundException(`Empleado con userId "${query.userId}" no encontrado`);
      }
      employeeId = employee.id;
    }

    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    if (query.locationId) {
      this.userLocationsService.assertLocationAllowed(allowedLocationIds, query.locationId);
    }

    return this.attendanceRepository.listHistory({
      tenantId,
      employeeId,
      locationId: query.locationId,
      allowedLocationIds,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  }

  async listActive(
    locationId: string,
    tenantId: string,
    actor: AttendanceActingUser,
  ): Promise<ActiveAttendanceEntry[]> {
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowedLocationIds, locationId);

    const logs = await this.attendanceRepository.listActiveAtLocation(locationId, tenantId);

    return logs.map((log) => ({
      logId: log.id,
      employeeId: log.employeeId,
      userId: log.employee.userId,
      fullName: log.employee.user.email.split('@')[0],
      locationId: log.locationId,
      entryTimestamp: log.timestamp,
      workDate: log.workDate,
      shift: log.shift,
    }));
  }

  async getOvertimeSummary(
    userId: string,
    tenantId: string,
    actor: AttendanceActingUser,
    date?: Date,
  ): Promise<OvertimeSummary> {
    const employee = await this.attendanceRepository.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException(`Empleado con userId "${userId}" no encontrado`);
    }

    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowedLocationIds, employee.locationId);

    const workDate = date ? normalizeWorkDate(date) : normalizeWorkDate(new Date());
    const logs = await this.attendanceRepository.findAllForDay(employee.id, workDate);
    const nocturnoStartHour = await this.legalParametersService.getValueAt(
      'HORARIO_NOCTURNO_INICIO',
      workDate,
      tenantId,
    );
    const summary = calculateDaySummary(logs, new Date(), nocturnoStartHour);

    return {
      employeeId: employee.id,
      userId,
      workDate: workDate.toISOString().slice(0, 10),
      totalMinutes: summary.totalMinutes,
      overtimeMinutes: summary.overtimeMinutes,
      isNocturno: summary.isNocturno,
      pairs: summary.pairs,
    };
  }

  private async assertManualMarkingWithinAssignedShift(
    input: RegisterEventInput,
    workDate: Date,
  ): Promise<void> {
    const resolved = await this.shiftResolutionService.resolveForDay({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      locationId: input.locationId,
      workDate,
    });

    if (resolved.kind !== 'ASSIGNED') {
      return;
    }

    const withinWindow = isTimestampWithinShiftWindow(
      input.timestamp,
      resolved.turno.horaInicio,
      resolved.turno.horaFin,
      SHIFT_WINDOW_TOLERANCE_MINUTES,
    );

    if (!withinWindow) {
      throw new BadRequestException(
        'La marcación manual está fuera de la ventana del turno asignado',
      );
    }
  }

  private incrementLockout(key: string): void {
    const existing = kioskLockout.get(key) ?? { attempts: 0, lockedUntil: null };
    const attempts = existing.attempts + 1;
    const lockedUntil =
      attempts >= KIOSK_MAX_ATTEMPTS ? new Date(Date.now() + KIOSK_LOCK_DURATION_MS) : null;
    kioskLockout.set(key, { attempts, lockedUntil });
    if (lockedUntil) {
      this.logger.warn(`Kiosk lockout: employeeId=${key} until=${lockedUntil.toISOString()}`);
    }
  }
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

function detectShift(ts: Date): AttendanceShift {
  const hour = getBogotaHour(ts);
  if (hour >= SHIFT_MORNING_START && hour < SHIFT_AFTERNOON_START) return AttendanceShift.MORNING;
  if (hour >= SHIFT_AFTERNOON_START && hour < SHIFT_AFTERNOON_END) return AttendanceShift.AFTERNOON;
  return AttendanceShift.NIGHT;
}

// calculateDaySummary moved to ../utils/attendance-calculation.util.ts
