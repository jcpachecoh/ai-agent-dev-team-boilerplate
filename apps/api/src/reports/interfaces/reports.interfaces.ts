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

// ── Shared data shapes ────────────────────────────────────────────────────────

export type ReportEmployeeWithLocation = EmployeeDetails & {
  user: User;
  location: Pick<Location, 'id' | 'name'>;
};

export interface ActiveEmployeeFilters {
  locationId?: string;
  contractType?: EmployeeContractType;
  employeeId?: string;
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
  getPayrollReport(tenantId: string, query: PeriodQueryDto): Promise<PayrollReportResponseDto>;

  getAttendanceReport(
    tenantId: string,
    query: AttendanceQueryDto,
  ): Promise<AttendanceReportResponseDto>;

  getSocialSecurityReport(
    tenantId: string,
    query: PeriodQueryDto,
  ): Promise<SocialSecurityReportResponseDto>;
}
