import type {
  AttendanceLog,
  EmployeeContractType,
  EmployeeDetails,
  Location,
  User,
} from '@prisma/client';
import type { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
import type { PayrollReportResponseDto } from '../controller/dto/payroll-report-response.dto';
import type { AttendanceReportResponseDto } from '../controller/dto/attendance-report-response.dto';
import type { SocialSecurityReportResponseDto } from '../controller/dto/social-security-report-response.dto';
import type { EmployeeListExportQueryDto } from '../controller/dto/employee-list-export-query.dto';
import type { AttendanceExportQueryDto } from '../controller/dto/attendance-export-query.dto';
import type { EmployeeListReportResponseDto } from '../controller/dto/employee-list-report-response.dto';

// ── Shared data shapes ────────────────────────────────────────────────────────

export type ReportEmployeeWithLocation = EmployeeDetails & {
  user: User;
  location: Pick<Location, 'id' | 'name'>;
};

export interface ActiveEmployeeFilters {
  locationId?: string;
  /** Sedes permitidas cuando el actor está acotado por rol (SUPERVISOR/MANAGER) y no pidió una sede puntual. */
  allowedLocationIds?: string[] | null;
  contractType?: EmployeeContractType;
  employeeId?: string;
}

/** Subconjunto del JwtPayload necesario para scoping de sede en reportes. */
export interface ReportsActor {
  userId: string;
  roleCode: string;
}

export interface ExportColumnDefinition {
  key: string;
  header: string;
  width?: number;
}

export interface ExportMetadata {
  tenantId: string;
  tenantName?: string;
  generatedAt: string;
  filtersSummary: string[];
  rowCount: number;
}

export interface IExportableReport<T> {
  data: T;
  metadata: ExportMetadata;
}

// ── Repository contract ───────────────────────────────────────────────────────

export interface IReportsRepository {
  findActiveEmployees(
    tenantId: string,
    options?: ActiveEmployeeFilters,
  ): Promise<ReportEmployeeWithLocation[]>;

  findAttendanceLogsByDateRange(
    tenantId: string,
    from: Date,
    to: Date,
    employeeIds?: string[],
  ): Promise<AttendanceLog[]>;
}

// ── Service contract ──────────────────────────────────────────────────────────

export interface IReportsService {
  getPayrollReport(
    tenantId: string,
    query: PeriodQueryDto,
    actor: ReportsActor,
  ): Promise<PayrollReportResponseDto>;

  getAttendanceReport(
    tenantId: string,
    query: AttendanceQueryDto,
    actor: ReportsActor,
  ): Promise<AttendanceReportResponseDto>;

  getSocialSecurityReport(
    tenantId: string,
    query: PeriodQueryDto,
    actor: ReportsActor,
  ): Promise<SocialSecurityReportResponseDto>;

  getEmployeeListReport(
    tenantId: string,
    query: Omit<EmployeeListExportQueryDto, 'format'>,
    actor: ReportsActor,
  ): Promise<EmployeeListReportResponseDto>;

  getAttendanceReportForExport(
    tenantId: string,
    query: Omit<AttendanceExportQueryDto, 'format'>,
    actor: ReportsActor,
  ): Promise<AttendanceReportResponseDto>;
}
