import { Injectable } from '@nestjs/common';
import { LeaveStatus, NovedadStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PendingSalaryResult } from '../interfaces/final-settlement.interfaces';

/**
 * OS-591 (fase 2) — Cálculo del tramo salarial no pagado hasta la fecha de terminación.
 *
 * Calcula únicamente el salario causado y no pagado entre el inicio del último
 * período de nómina no liquidado y `effectiveTerminationDate`.
 *
 * ## Decisiones documentadas
 *
 * 1. **Período de nómina**: se usa convención mensual (del 1 al último día del mes).
 *    `lastPaidPeriod` se infiere del último `payrollPeriod` en `OvertimeRequest`
 *    aprobados o, si no existe, del `contractStartDate`. Esto es una aproximación —
 *    el sistema no tiene una tabla de "períodos de nómina cerrados". En una fase
 *    futura, cuando exista dicha tabla, este servicio debería leerla.
 *
 * 2. **Novedades no remuneradas**: se descuentan los días de `PayrollNovedad` con
 *    `status=APROBADA`, `isPaid=false`, y rango que se solapa con el tramo.
 *
 * 3. **Licencias remuneradas**: no se descuentan (el empleado percibe salario completo).
 *
 * 4. **Incapacidades**: se consultan `MedicalLeave` aprobadas en el tramo. Los días
 *    de incapacidad se descuentan del salario ordinario (la EPS/ARL paga directamente
 *    a partir del 4to día — CST art. 227). Simplificación: se descuentan TODOS los
 *    días de incapacidad del tramo como "no pagados por el empleador".
 *
 * 5. **Horas extra pendientes**: se suman las `OvertimeRequest` con `status=APROBADA`
 *    que caen en el tramo y no han sido liquidadas en nómina previa.
 *
 * 6. **NO ejecuta batch**: solo calcula para el empleado especificado.
 */
@Injectable()
export class PendingSalaryService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(
    tenantId: string,
    employeeDetailsId: string,
    effectiveTerminationDate: Date,
    contractStartDate: Date,
  ): Promise<PendingSalaryResult> {
    const warnings: string[] = [];
    const sources: string[] = [];

    // ── 1. Salario vigente a la fecha de terminación ───────────────────────
    const salaryRecord = await this.prisma.employeeSalaryHistory.findFirst({
      where: {
        tenantId,
        employeeDetailsId,
        effectiveFrom: { lte: effectiveTerminationDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveTerminationDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const monthlySalary = salaryRecord
      ? new Prisma.Decimal(salaryRecord.salaryAmount.toString())
      : new Prisma.Decimal(0);

    if (!salaryRecord) {
      warnings.push('pending_salary_no_salary_history — sin historial salarial vigente');
    }

    if (salaryRecord) {
      sources.push(`EmployeeSalaryHistory:${salaryRecord.id}`);
    }

    const dailySalary = monthlySalary.dividedBy(30);

    // ADVERTENCIA DE DOBLE PAGO: este servicio calcula el salario CAUSADO en el
    // tramo estimado, no el neto de lo ya pagado en nómina. El sistema no tiene
    // una tabla de "períodos de nómina cerrados"; se infiere el tramo desde
    // OvertimeRequest.payrollPeriod como mejor aproximación disponible.
    // Si el período fue cerrado en nómina sin registros de overtime, el tramo
    // completo se calculará como "pendiente", generando riesgo de doble pago.
    // Este riesgo DEBE verificarse manualmente antes de aprobar la liquidación.
    warnings.push(
      'pending_salary_double_payment_risk — ADVERTENCIA: el período pendiente se estima desde el último payrollPeriod de overtime; sin tabla de nóminas cerradas no se puede garantizar que el salario del tramo no fue ya liquidado. Validar antes de aprobar.',
    );

    // ── 2. Determinar el inicio del tramo no pagado ────────────────────────
    // Aproximación: si hay overtime con payrollPeriod el más reciente, inferir el
    // período; de lo contrario usar el 1ro del mes de terminación.
    const lastOvertimePeriod = await this.prisma.overtimeRequest.findFirst({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: 'APROBADA',
        deletedAt: null,
        payrollPeriod: { not: null },
      },
      orderBy: { shiftEndTime: 'desc' },
      select: { payrollPeriod: true },
    });

    // periodStart = 1ro del mes de terminación (si no hay referencia mejor)
    const terminationYear = effectiveTerminationDate.getFullYear();
    const terminationMonth = effectiveTerminationDate.getMonth();

    let periodStart: Date;

    if (lastOvertimePeriod?.payrollPeriod) {
      // payrollPeriod formato 'YYYY-MM' — el tramo pendiente comienza el día siguiente
      // al último período procesado
      const [py, pm] = lastOvertimePeriod.payrollPeriod.split('-').map(Number);
      // El período siguiente al último procesado
      const nextMonth = pm === 12 ? 1 : pm + 1;
      const nextYear = pm === 12 ? py + 1 : py;
      periodStart = new Date(nextYear, nextMonth - 1, 1);
    } else {
      periodStart = new Date(terminationYear, terminationMonth, 1);
    }

    // Si periodStart cae después de effectiveTerminationDate, no hay tramo pendiente
    if (periodStart > effectiveTerminationDate) {
      periodStart = new Date(terminationYear, terminationMonth, 1);
    }

    // No ir antes del inicio del contrato
    if (periodStart < contractStartDate) {
      periodStart = new Date(contractStartDate);
    }

    const periodEnd = effectiveTerminationDate;

    // ── 3. Días comerciales en el tramo ────────────────────────────────────
    const msPerDay = 1000 * 60 * 60 * 24;
    const calendarDays = Math.max(
      0,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1,
    );

    // Convención comercial: fracciones de mes = (days / 30)
    const commercialDays = Math.min(calendarDays, 30);

    // ── 4. Novedades no remuneradas en el tramo ────────────────────────────
    const unpaidNovedades = await this.prisma.payrollNovedad.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: NovedadStatus.APROBADA,
        isPaid: false,
        deletedAt: null,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        type: true,
      },
    });

    let unpaidNovedadDays = 0;
    for (const nov of unpaidNovedades) {
      const overlapStart = nov.startDate > periodStart ? nov.startDate : periodStart;
      const overlapEnd = nov.endDate < periodEnd ? nov.endDate : periodEnd;
      const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1;
      unpaidNovedadDays += Math.max(0, days);
      sources.push(`PayrollNovedad:${nov.id}`);
    }

    // ── 5. Incapacidades médicas en el tramo ──────────────────────────────
    // MedicalLeave no tiene status APROBADA — usa LeaveStatus (REGISTRADA, RADICADA_EPS,
    // RECOBRADA, RECHAZADA). Se incluyen todas las incapacidades no rechazadas como
    // "causadas" para el cálculo de salario pendiente.
    const medicalLeaves = await this.prisma.medicalLeave.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: { not: LeaveStatus.RECHAZADA },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    let medicalLeaveDays = 0;
    for (const leave of medicalLeaves) {
      const overlapStart = leave.startDate > periodStart ? leave.startDate : periodStart;
      const overlapEnd = leave.endDate < periodEnd ? leave.endDate : periodEnd;
      const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1;
      medicalLeaveDays += Math.max(0, days);
      sources.push(`MedicalLeave:${leave.id}`);
    }

    if (medicalLeaveDays > 0) {
      warnings.push(
        `pending_salary_medical_leave_simplified — ${medicalLeaveDays} día(s) de incapacidad descontados como no pagados por el empleador (simplificación: no distingue pagados por EPS a partir del 4to día)`,
      );
    }

    // ── 6. Horas extra aprobadas pendientes en el tramo ────────────────────
    const pendingOvertime = await this.prisma.overtimeRequest.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: 'APROBADA',
        deletedAt: null,
        shiftEndTime: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        accumulatedMinutes: true,
        type: true,
      },
    });

    const MONTHLY_HOURS_BASE = 240;
    const EXTRA_DIURNA_RATE = 0.25;
    const EXTRA_NOCTURNA_RATE = 0.75;
    let pendingOvertimeAmount = new Prisma.Decimal(0);

    for (const ot of pendingOvertime) {
      const hours = ot.accumulatedMinutes / 60;
      const surchargeRate =
        ot.type === 'SOLICITUD_ADMINISTRATIVA' ? EXTRA_NOCTURNA_RATE : EXTRA_DIURNA_RATE;
      const hourlyRate = monthlySalary.dividedBy(MONTHLY_HOURS_BASE);
      pendingOvertimeAmount = pendingOvertimeAmount.plus(
        hourlyRate.times(1 + surchargeRate).times(hours),
      );
      sources.push(`OvertimeRequest:${ot.id}`);
    }

    if (pendingOvertime.length > 0) {
      warnings.push(
        'pending_salary_overtime_approximation — tasa de recargo estimada para horas extra pendientes en el tramo',
      );
    }

    // ── 7. Calcular tramo de salario base pendiente ────────────────────────
    const paidDays = unpaidNovedadDays + medicalLeaveDays;
    const effectivePaidDays = Math.min(paidDays, commercialDays);
    const basePendingSalary = dailySalary
      .times(Math.max(0, commercialDays - effectivePaidDays))
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const novedadDeductions = dailySalary
      .times(effectivePaidDays)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const pendingOvertimeRounded = pendingOvertimeAmount.toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

    const totalPendingSalary = basePendingSalary
      .plus(pendingOvertimeRounded)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const breakdown: PendingSalaryResult['breakdown'] = [
      {
        concept: 'SALARIO_BASE_PENDIENTE',
        amount: basePendingSalary.toFixed(2),
        detail: `${commercialDays - effectivePaidDays} días × $${dailySalary.toFixed(2)}/día`,
      },
    ];

    if (novedadDeductions.greaterThan(0)) {
      breakdown.push({
        concept: 'DESCUENTO_NOVEDADES_NO_REMUNERADAS',
        amount: `-${novedadDeductions.toFixed(2)}`,
        detail: `${effectivePaidDays} día(s) de novedades/incapacidades`,
      });
    }

    if (pendingOvertimeRounded.greaterThan(0)) {
      breakdown.push({
        concept: 'HORAS_EXTRA_PENDIENTES',
        amount: pendingOvertimeRounded.toFixed(2),
        detail: `${pendingOvertime.length} solicitud(es) de overtime en el tramo`,
      });
    }

    return {
      periodStart,
      periodEnd,
      calendarDays,
      commercialDays,
      monthlySalary: monthlySalary.toFixed(2),
      dailySalary: dailySalary.toFixed(2),
      basePendingSalary: basePendingSalary.toFixed(2),
      novedadDeductions: novedadDeductions.toFixed(2),
      pendingOvertimeAmount: pendingOvertimeRounded.toFixed(2),
      totalPendingSalary: totalPendingSalary.toFixed(2),
      breakdown,
      sources: [...new Set(sources)],
      warnings,
    };
  }
}
