import { Injectable } from '@nestjs/common';
import { ArlRiskLevel, EmployeeCatalogType, type DocumentType } from '@prisma/client';

import { countApprovedVacationDaysInRange } from '../../attendance/service/vacation-attendance.guard';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { MedicalLeavesRepository } from '../../medical-leaves/repository/medical-leaves.repository';
import { PayrollNovedadesRepository } from '../../payroll-novedades/repository/payroll-novedades.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { PayrollEmployeeRowDto } from '../../reports/controller/dto/payroll-report-response.dto';
import type { ReportsActor } from '../../reports/interfaces/reports.interfaces';
import { ReportsService } from '../../reports/service/reports.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import { EmployeeCatalogService } from '../service/employee-catalog.service';
import { TenantPilaConfigService } from '../service/tenant-pila-config.service';
import { normalizeNitDigits } from '../utils/pila-master-data.util';
import { adaptOs380EmployeeToCotizanteDraft, isDateInPeriod } from './pila-os380.adapter';
import { PilaErrorCode } from './pila-error-codes';
import type {
  PilaEmployeeEnrichment,
  PilaEmployeeEventFlags,
  PilaOs380EmployeeSlice,
  PilaPeriodDraft,
  PilaPreparationResult,
  PilaValidationError,
} from './pila-preparation.interfaces';
import {
  validateEmployeeForPila,
  validatePilaPeriodFormat,
  validateTenantForPila,
} from './pila-validation';

function firstDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function catalogNameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * OS-595 Fase 2 — preparación de objeto intermedio PILA.
 * Consume OS-380 vía ReportsService.getPayrollReport; no serializa TXT ni persiste export.
 *
 * Pasos: obtención → adaptación OS-380 → enriquecimiento catálogos → validación → draft.
 */
@Injectable()
export class PilaPreparationService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
    private readonly tenantPilaConfigService: TenantPilaConfigService,
    private readonly employeeCatalogService: EmployeeCatalogService,
    private readonly medicalLeavesRepository: MedicalLeavesRepository,
    private readonly payrollNovedadesRepository: PayrollNovedadesRepository,
    private readonly vacationsService: VacationsService,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  async preparePeriod(
    tenantId: string,
    period: string,
    actor: ReportsActor,
  ): Promise<PilaPreparationResult> {
    const periodError = validatePilaPeriodFormat(period);
    if (periodError) {
      return { ok: false, data: null, errors: [periodError] };
    }

    const [year, month] = period.split('-').map(Number) as [number, number];
    const from = firstDayOfMonth(year, month);
    const to = lastDayOfMonth(year, month);

    // 1) Obtención de datos (tenant + config + OS-380 + catálogos)
    const [tenant, pilaConfig, payrollReport, catalogOptions, smlvRaw] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: { id: tenantId, deletedAt: null },
        select: {
          id: true,
          name: true,
          legalName: true,
          nit: true,
          verificationDigit: true,
        },
      }),
      this.tenantPilaConfigService.findByTenantId(tenantId),
      this.reportsService.getPayrollReport(tenantId, { period }, actor),
      this.employeeCatalogService.findAll(tenantId),
      this.legalParametersService.getValueAt('SMLV', to, tenantId),
    ]);

    const errors: PilaValidationError[] = [];

    if (!tenant) {
      errors.push({
        code: PilaErrorCode.TENANT_PILA_CONFIG_MISSING,
        field: 'tenantId',
        message: `Tenant "${tenantId}" no encontrado.`,
      });
      return { ok: false, data: null, errors };
    }

    if (!payrollReport.employees.length) {
      errors.push({
        code: PilaErrorCode.PERIOD_NO_OS380_DATA,
        field: 'period',
        message: `No hay empleados con liquidación OS-380 para el período ${period}.`,
      });
    }

    const arlByCode = new Map(
      catalogOptions
        .filter((o) => o.type === EmployeeCatalogType.ARL && o.pilaCode)
        .map((o) => [o.pilaCode as string, o]),
    );
    const arlCatalogHasCode = Boolean(pilaConfig?.arlCode && arlByCode.has(pilaConfig.arlCode));

    errors.push(
      ...validateTenantForPila({
        nit: tenant.nit,
        verificationDigit: tenant.verificationDigit,
        pilaConfig,
        arlCatalogHasCode,
      }),
    );

    const employeeIds = payrollReport.employees.map((e) => e.employeeId);

    // 2–3) Enriquecimiento + eventos (leaves/novedades batch; vacaciones por API existente)
    const enrichmentById = await this.loadEnrichment(tenantId, employeeIds, catalogOptions);
    const eventFlags = await this.buildEventFlags(
      tenantId,
      employeeIds,
      from,
      to,
      year,
      month,
      enrichmentById,
    );

    const smlvNumber = Number(smlvRaw);
    const cotizanteDrafts = [];

    for (const row of payrollReport.employees) {
      const enrichment = enrichmentById.get(row.employeeId);
      if (!enrichment) {
        errors.push({
          code: PilaErrorCode.PERIOD_NO_OS380_DATA,
          field: 'employee',
          message: `No se encontraron datos maestros para el empleado ${row.employeeId}.`,
          employeeId: row.employeeId,
          employeeName: row.employeeName,
        });
        continue;
      }

      const slice = this.toOs380Slice(row);
      const events = eventFlags.get(row.employeeId) ?? {
        employeeId: row.employeeId,
        hasMedicalLeaveInPeriod: false,
        hasVacationInPeriod: false,
        hasPayrollNovedadInPeriod: false,
        hasIngressInPeriod: false,
        hasRetirementInPeriod: false,
      };

      errors.push(
        ...validateEmployeeForPila({
          slice,
          enrichment,
          events,
          smlv: smlvNumber,
        }),
      );

      const draft = adaptOs380EmployeeToCotizanteDraft(
        slice,
        enrichment,
        pilaConfig?.actividadEconomicaArl ?? '',
      );
      if (draft) {
        cotizanteDrafts.push(draft);
      }
    }

    // No ignorar empleados inválidos: cualquier error → fallo de lote sin draft
    if (errors.length > 0) {
      return { ok: false, data: null, errors };
    }

    if (
      !pilaConfig?.arlCode ||
      !pilaConfig.actividadEconomicaArl ||
      !tenant.nit ||
      !tenant.verificationDigit
    ) {
      return {
        ok: false,
        data: null,
        errors: [
          {
            code: PilaErrorCode.TENANT_PILA_CONFIG_MISSING,
            field: 'tenantPilaConfig',
            message: 'Configuración PILA incompleta tras validación.',
          },
        ],
      };
    }

    const data: PilaPeriodDraft = {
      tenantId,
      period,
      aportante: {
        legalName: tenant.legalName ?? tenant.name,
        documentType: pilaConfig.documentType,
        nit: normalizeNitDigits(tenant.nit),
        verificationDigit: tenant.verificationDigit,
        tipoPlanilla: 'E',
        formaPresentacion: pilaConfig.formaPresentacion,
        tipoAportante: pilaConfig.tipoAportante,
        claseAportante: pilaConfig.claseAportante,
        naturalezaJuridica: pilaConfig.naturalezaJuridica,
        arlCode: pilaConfig.arlCode,
        actividadEconomicaArl: pilaConfig.actividadEconomicaArl,
        periodHealth: period,
        periodOther: period,
        exemptFromHealthSenaIcbfLey1607: pilaConfig.exemptFromHealthSenaIcbfLey1607,
      },
      cotizantes: cotizanteDrafts,
      totals: {
        employeeCount: cotizanteDrafts.length,
        totalPayrollCost: payrollReport.tenantTotals.totalPayrollCost,
        totalEmployeeContributions: cotizanteDrafts.reduce(
          (sum, c) => sum + c.contributions.employeeHealth + c.contributions.employeePension,
          0,
        ),
        totalEmployerContributions: payrollReport.tenantTotals.totalEmployerContributions,
      },
    };

    return { ok: true, data, errors: [] };
  }

  private toOs380Slice(row: PayrollEmployeeRowDto): PilaOs380EmployeeSlice {
    return {
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      contractType: row.contractType,
      salaryType: row.salaryType,
      salaryAmount: row.salaryAmount,
      salaryBase: row.salaryBase,
      contributionBase: row.contributionBase,
      workedDays: row.workedDays,
      healthDeduction: row.healthDeduction,
      pensionDeduction: row.pensionDeduction,
      employerHealthContribution: row.employerHealthContribution,
      employerPensionContribution: row.employerPensionContribution,
      employerArlContribution: row.employerArlContribution,
      employerSenaContribution: row.employerSenaContribution,
      employerIcbfContribution: row.employerIcbfContribution,
      employerCajaContribution: row.employerCajaContribution,
      totalEmployerContributions: row.totalEmployerContributions,
      totalPayrollCost: row.totalPayrollCost,
      medicalLeaveOrdinaryDaysExcluded: row.medicalLeaveOrdinaryDaysExcluded,
      medicalLeaveEpsArlDays: row.medicalLeaveEpsArlDays,
    };
  }

  private async loadEnrichment(
    tenantId: string,
    employeeIds: string[],
    catalogOptions: Array<{
      type: EmployeeCatalogType;
      name: string;
      pilaCode: string | null;
    }>,
  ): Promise<Map<string, PilaEmployeeEnrichment>> {
    const map = new Map<string, PilaEmployeeEnrichment>();
    if (employeeIds.length === 0) return map;

    const byTypeName = (type: EmployeeCatalogType): Map<string, string | null> => {
      const m = new Map<string, string | null>();
      for (const o of catalogOptions) {
        if (o.type === type) {
          m.set(catalogNameKey(o.name), o.pilaCode);
        }
      }
      return m;
    };

    const epsCodes = byTypeName(EmployeeCatalogType.EPS);
    const afpCodes = byTypeName(EmployeeCatalogType.PENSION_FUND);
    const arlCodes = byTypeName(EmployeeCatalogType.ARL);
    const ccfCodes = byTypeName(EmployeeCatalogType.CAJA_COMPENSACION);

    const rows = await this.prisma.employeeDetails.findMany({
      where: { tenantId, id: { in: employeeIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        hireDate: true,
        contractStart: true,
        contractEnd: true,
        epsName: true,
        pensionFundName: true,
        arlName: true,
        cajaCompensacion: true,
        arlRiskLevel: true,
        user: { select: { cedula: true, documentType: true } },
        personalData: {
          select: { nombres: true, primerApellido: true, segundoApellido: true },
        },
        location: {
          select: {
            code: true,
            departmentCode: true,
            municipalityCode: true,
            city: true,
            name: true,
          },
        },
      },
    });

    for (const row of rows) {
      map.set(row.id, {
        employeeId: row.id,
        employeeName: row.name,
        documentType: (row.user.documentType as DocumentType | null) ?? null,
        documentNumber: row.user.cedula,
        firstName: row.personalData?.nombres ?? null,
        firstLastName: row.personalData?.primerApellido ?? null,
        secondLastName: row.personalData?.segundoApellido ?? null,
        hireDate: row.hireDate,
        contractStart: row.contractStart,
        contractEnd: row.contractEnd,
        epsName: row.epsName,
        pensionFundName: row.pensionFundName,
        arlName: row.arlName,
        cajaCompensacion: row.cajaCompensacion,
        arlRiskLevel: row.arlRiskLevel as ArlRiskLevel,
        // location puede ser null (CONN-06: empleados ROTANTE sin sede fija).
        // La validación PILA bloquea export si faltan códigos DIVIPOLA.
        departmentCode: row.location?.departmentCode ?? null,
        municipalityCode: row.location?.municipalityCode ?? null,
        locationCode: row.location?.code ?? null,
        locationCityName: row.location?.city ?? row.location?.name ?? null,
        epsPilaCode: epsCodes.get(catalogNameKey(row.epsName)) ?? null,
        afpPilaCode: afpCodes.get(catalogNameKey(row.pensionFundName)) ?? null,
        arlPilaCode: arlCodes.get(catalogNameKey(row.arlName)) ?? null,
        ccfPilaCode: ccfCodes.get(catalogNameKey(row.cajaCompensacion)) ?? null,
      });
    }

    return map;
  }

  private async buildEventFlags(
    tenantId: string,
    employeeIds: string[],
    from: Date,
    to: Date,
    year: number,
    month: number,
    enrichmentById: Map<string, PilaEmployeeEnrichment>,
  ): Promise<Map<string, PilaEmployeeEventFlags>> {
    const map = new Map<string, PilaEmployeeEventFlags>();
    for (const id of employeeIds) {
      const enrichment = enrichmentById.get(id);
      map.set(id, {
        employeeId: id,
        hasMedicalLeaveInPeriod: false,
        hasVacationInPeriod: false,
        hasPayrollNovedadInPeriod: false,
        hasIngressInPeriod: enrichment
          ? isDateInPeriod(enrichment.hireDate, year, month) ||
            isDateInPeriod(enrichment.contractStart, year, month)
          : false,
        hasRetirementInPeriod: enrichment?.contractEnd
          ? isDateInPeriod(enrichment.contractEnd, year, month)
          : false,
      });
    }

    if (employeeIds.length === 0) return map;

    const [leaves, novedades] = await Promise.all([
      this.medicalLeavesRepository.findOverlappingForPayrollPeriodByEmployeeIds(
        tenantId,
        employeeIds,
        from,
        to,
      ),
      this.payrollNovedadesRepository.findApprovedForPeriodByEmployeeIds(
        tenantId,
        employeeIds,
        from,
        to,
      ),
    ]);

    for (const leave of leaves) {
      const flags = map.get(leave.employeeId);
      if (flags) flags.hasMedicalLeaveInPeriod = true;
    }
    for (const nov of novedades) {
      const flags = map.get(nov.employeeId);
      if (flags) flags.hasPayrollNovedadInPeriod = true;
    }

    // Misma API por empleado que ReportsService (sin batch de vacaciones disponible).
    await Promise.all(
      employeeIds.map(async (employeeId) => {
        const ranges = await this.vacationsService.getApprovedDisfruteRanges(
          tenantId,
          employeeId,
          from,
          to,
        );
        const days = countApprovedVacationDaysInRange(ranges, from, to);
        if (days > 0) {
          const flags = map.get(employeeId);
          if (flags) flags.hasVacationInPeriod = true;
        }
      }),
    );

    return map;
  }
}
