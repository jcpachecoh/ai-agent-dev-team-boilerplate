import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AttendanceEventType, AttendanceShift } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  KIOSK_LOCK_DURATION_MS,
  KIOSK_MAX_ATTEMPTS,
  SHIFT_AFTERNOON_END,
  SHIFT_AFTERNOON_START,
  SHIFT_MORNING_START,
} from '../attendance.constants';
import type {
  ActiveAttendanceEntry,
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
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository, normalizeWorkDate } from '../repository/attendance.repository';
import { calculateDaySummary, getBogotaHour } from '../utils/attendance-calculation.util';

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

  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async kioskAuth(dto: KioskAuthInput, tenantId: string): Promise<KioskAuthResult> {
    const user = await this.attendanceRepository.findUserByCedula(dto.cedula, tenantId);
    if (!user) {
      throw new UnauthorizedException('Cédula o PIN incorrecto');
    }

    const employee = await this.attendanceRepository.findEmployeeByUserAndLocation(
      user.id,
      dto.locationId,
      tenantId,
    );
    if (!employee) {
      throw new ForbiddenException('Empleado no encontrado en esta sede');
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

    const fullName = `${user.cedula}`;
    this.logger.log(`Kiosk auth OK: employeeId=${employee.id} tenantId=${tenantId}`);

    return {
      userId: user.id,
      fullName: user.email.split('@')[0],
      locationId: employee.locationId,
      employeeId: employee.id,
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

    const summary = calculateDaySummary(allLogsForDay, now);

    this.logger.log(
      `EXIT: employeeId=${employee.id} workDate=${openEntry.workDate.toISOString()} totalMin=${summary.totalMinutes}`,
    );

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

  async listHistory(query: ListHistoryInput, tenantId: string): Promise<AttendanceLogFull[]> {
    let employeeId: string | undefined;

    if (query.userId) {
      const employee = await this.attendanceRepository.findEmployeeByUserId(query.userId, tenantId);
      if (!employee) {
        throw new NotFoundException(`Empleado con userId "${query.userId}" no encontrado`);
      }
      employeeId = employee.id;
    }

    return this.attendanceRepository.listHistory({
      tenantId,
      employeeId,
      locationId: query.locationId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  }

  async listActive(locationId: string, tenantId: string): Promise<ActiveAttendanceEntry[]> {
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
    date?: Date,
  ): Promise<OvertimeSummary> {
    const employee = await this.attendanceRepository.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException(`Empleado con userId "${userId}" no encontrado`);
    }

    const workDate = date ? normalizeWorkDate(date) : normalizeWorkDate(new Date());
    const logs = await this.attendanceRepository.findAllForDay(employee.id, workDate);
    const summary = calculateDaySummary(logs, new Date());

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
