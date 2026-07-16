import {
  AttendanceEventType,
  AttendanceLog,
  AttendanceVerificationMethod,
  type KioskMarkingSession,
} from '@prisma/client';

export const KIOSK_FACIAL_THRESHOLD = 0.85;
export const POST_CUTOFF_USE_NOVEDAD = 'POST_CUTOFF_USE_NOVEDAD';
export const KIOSK_MARKING_PERMISSION = 'attendance.kiosk.mark';
export const KIOSK_ACTIVATE_PERMISSION = 'attendance.kiosk.activate';

export type KioskMarkingEventType = AttendanceEventType;

export interface ActivarModoMarcacionKioskoInput {
  locationId: string;
}

export interface ModoMarcacionKioskoSessionResult {
  accessToken: string;
  expiresAt: Date;
  locationId: string;
  sessionId: string;
}

export interface SalirModoMarcacionKioskoInput {
  adminPassword: string;
}

export interface EmpleadoTurnoKioskoResult {
  employeeId: string;
  userId: string;
  fullName: string;
  turnoLabel: string | null;
  turnoStartTime: string | null;
  turnoEndTime: string | null;
  hasOpenEntry: boolean;
  suggestedEventType: AttendanceEventType;
  hasPinConfigured: boolean;
  hasFacialReference: boolean;
  hasBiometricConsent: boolean;
}

export interface FotoReferenciaKioskoResult {
  employeeId: string;
  photoUrl: string;
  expiresAt: Date;
}

export interface RegistrarMarcacionKioskoInput {
  employeeId: string;
  eventType: AttendanceEventType;
  storageObjectId: string;
  facialMatchScore?: number | null;
  facialMatchResult?: string | null;
  pin?: string | null;
  notes?: string | null;
  timestamp?: Date | null;
}

export interface MarcacionKioskoResult {
  id: string;
  eventType: AttendanceEventType;
  workDate: string;
  timestamp: Date;
  verificationMethod: AttendanceVerificationMethod;
  status: string;
}

export interface VerificarPinEmpleadoKioskoInput {
  employeeId: string;
  pin: string;
}

export interface CorregirMarcacionKioskoInput {
  attendanceLogId: string;
  eventType: AttendanceEventType;
  timestamp: Date;
  reason: string;
  notes?: string | null;
}

export interface AnularMarcacionKioskoResult {
  id: string;
  isActive: boolean;
}

export interface KioskTokenContext {
  sub: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  roleCode: string;
}

export interface IKioskMarkingSessionService {
  activar(
    input: ActivarModoMarcacionKioskoInput,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<ModoMarcacionKioskoSessionResult>;
  salir(input: SalirModoMarcacionKioskoInput, token: KioskTokenContext): Promise<boolean>;
  getActiveSession(sessionId: string, tenantId: string): Promise<KioskMarkingSession | null>;
}

export interface IKioskMarkingService {
  listEmpleadosTurnoHoy(
    token: KioskTokenContext,
    workDate?: string | null,
  ): Promise<EmpleadoTurnoKioskoResult[]>;
  getFotoReferencia(
    token: KioskTokenContext,
    employeeId: string,
  ): Promise<FotoReferenciaKioskoResult>;
  registrarMarcacion(
    token: KioskTokenContext,
    input: RegistrarMarcacionKioskoInput,
  ): Promise<MarcacionKioskoResult>;
  verificarPin(token: KioskTokenContext, input: VerificarPinEmpleadoKioskoInput): Promise<boolean>;
  anularMarcacion(
    attendanceLogId: string,
    reason: string,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<AnularMarcacionKioskoResult>;
  corregirMarcacion(
    input: CorregirMarcacionKioskoInput,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<AttendanceLog>;
}
