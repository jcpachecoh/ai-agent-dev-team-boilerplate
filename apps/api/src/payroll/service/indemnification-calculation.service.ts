import { Injectable } from '@nestjs/common';
import { EmployeeContractType, Prisma } from '@prisma/client';

import {
  IndemnificationInputs,
  IndemnificationResult,
} from '../interfaces/final-settlement.interfaces';

/**
 * OS-591 (fase 2) — Motor puro de indemnización por terminación de contrato.
 *
 * Sin acceso a DB, sin efectos secundarios. Recibe todos los datos ya resueltos
 * por el caller (FinalSettlementAggregatorService) y devuelve el desglose completo.
 *
 * Base legal: CST art. 64 (texto actual, Ley 789 de 2002).
 *
 * Aritmética en Prisma.Decimal (no `number`) — mismo criterio que
 * CesantiasCalculationService: los montos de salario y SMLMV vienen de la base
 * de datos como Decimal; operar en float introduciría error de redondeo.
 *
 * DAYS360: deliberadamente NO se usa para contratos FIJO ni OBRA_LABOR. CST art. 64
 * no establece una convención de días específica para la fórmula de indemnización
 * — los "días restantes" de un contrato FIJO son días calendario reales entre
 * effectiveTerminationDate y agreedEndDate. Usar DAYS360 aquí requeriría una
 * decisión legal explícita que no existe en este ticket. Ver tasks/OS-591.md.
 */
@Injectable()
export class IndemnificationCalculationService {
  /**
   * Calcula la indemnización según el motivo y tipo de contrato.
   * Devuelve amount='0' para causales sin indemnización (RENUNCIA, JUSTA_CAUSA,
   * MUTUO_ACUERDO, VENCIMIENTO_TERMINO, MUERTE_TRABAJADOR, OTRA).
   */
  calculate(inputs: IndemnificationInputs): IndemnificationResult {
    const {
      contractType,
      terminationReason,
      contractStartDate,
      effectiveTerminationDate,
      monthlySalary,
      smlvAmount,
      smlvThreshold,
      agreedEndDate,
      estimatedRemainingDays,
      estimatedRemainingDaysJustification,
      formulaVersion,
    } = inputs;

    const THIRTY = new Prisma.Decimal(30);
    const warnings: string[] = [];

    // dailySalary = monthlySalary / 30 (convención comercial, no 365 días)
    const dailySalary = monthlySalary.dividedBy(THIRTY);

    // ── Causales sin indemnización ─────────────────────────────────────────
    const noIndemReason = [
      'RENUNCIA',
      'JUSTA_CAUSA',
      'MUTUO_ACUERDO',
      'VENCIMIENTO_TERMINO',
      'MUERTE_TRABAJADOR',
      'OTRA',
    ] as const;

    if ((noIndemReason as readonly string[]).includes(terminationReason)) {
      return this.buildZeroResult(
        monthlySalary,
        dailySalary,
        terminationReason,
        contractType,
        contractStartDate,
        effectiveTerminationDate,
        monthlySalary,
        smlvThreshold,
        formulaVersion,
        warnings,
      );
    }

    // terminationReason === 'SIN_JUSTA_CAUSA'
    switch (contractType) {
      case EmployeeContractType.INDEFINIDO:
        return this.calcIndefinido(
          monthlySalary,
          dailySalary,
          smlvAmount,
          smlvThreshold,
          contractStartDate,
          effectiveTerminationDate,
          formulaVersion,
          warnings,
        );

      case EmployeeContractType.FIJO:
        return this.calcFijo(
          monthlySalary,
          dailySalary,
          agreedEndDate ?? null,
          effectiveTerminationDate,
          contractStartDate,
          smlvAmount,
          smlvThreshold,
          formulaVersion,
          warnings,
        );

      case EmployeeContractType.OBRA:
        return this.calcObraLabor(
          monthlySalary,
          dailySalary,
          estimatedRemainingDays ?? null,
          estimatedRemainingDaysJustification ?? null,
          contractStartDate,
          effectiveTerminationDate,
          smlvAmount,
          smlvThreshold,
          formulaVersion,
          warnings,
        );

      default:
        // Contrato TEMPORAL u otro futuro → mismas reglas que INDEFINIDO
        warnings.push(`contract_type_fallback:${contractType} — se aplicó regla INDEFINIDO`);
        return this.calcIndefinido(
          monthlySalary,
          dailySalary,
          smlvAmount,
          smlvThreshold,
          contractStartDate,
          effectiveTerminationDate,
          formulaVersion,
          warnings,
        );
    }
  }

  // ── Contrato INDEFINIDO ─────────────────────────────────────────────────

  private calcIndefinido(
    monthlySalary: Prisma.Decimal,
    dailySalary: Prisma.Decimal,
    smlvAmount: Prisma.Decimal,
    smlvThreshold: Prisma.Decimal,
    contractStartDate: Date,
    effectiveTerminationDate: Date,
    formulaVersion: number,
    warnings: string[],
  ): IndemnificationResult {
    const { tenureYears, tenureDays, fractionalYearDays } = this.calcTenure(
      contractStartDate,
      effectiveTerminationDate,
    );

    const salaryInSmlv = monthlySalary.dividedBy(smlvAmount);
    const isAboveThreshold = salaryInSmlv.greaterThanOrEqualTo(smlvThreshold);

    let baseYearDays: number;
    let additionalDaysPerYear: number;
    let appliedRule: string;

    if (isAboveThreshold) {
      // >= 10 SMLMV: 20 días primer año + 15 días proporcionales adicionales
      baseYearDays = 20;
      additionalDaysPerYear = 15;
      appliedRule = `INDEFINIDO_ALTO:>=_${smlvThreshold.toString()}_SMLMV — 20 días (1er año) + 15 días/año adicional`;
    } else {
      // < 10 SMLMV: 30 días primer año + 20 días proporcionales adicionales
      baseYearDays = 30;
      additionalDaysPerYear = 20;
      appliedRule = `INDEFINIDO_BAJO:<_${smlvThreshold.toString()}_SMLMV — 30 días (1er año) + 20 días/año adicional`;
    }

    // Días del primer año (plano si < 1 año, completo si >= 1 año)
    let totalDays: Prisma.Decimal;

    if (tenureYears < 1) {
      // CST art. 64 (Ley 789/2002): "Treinta (30) días de salario cuando el trabajador
      // tuviere un tiempo de servicio no mayor de un (1) año." — el texto fija el monto
      // como una cantidad cerrada (30 / 20 días), no una fracción proporcional.
      // Ver hallazgo OS-591 Fase 2 — antigüedad < 1 año sin prorratear el primer bloque.
      totalDays = new Prisma.Decimal(baseYearDays);
      appliedRule += ` — antigüedad < 1 año, ${baseYearDays} días completos (CST art. 64)`;
    } else {
      // Primer año completo
      const firstYear = new Prisma.Decimal(baseYearDays);
      // Años adicionales completos × additionalDaysPerYear días
      const additionalFullYears = tenureYears - 1;
      const additionalFull = new Prisma.Decimal(additionalDaysPerYear).times(additionalFullYears);
      // Fracción de año posterior al primer año
      const additionalFraction = new Prisma.Decimal(additionalDaysPerYear)
        .times(fractionalYearDays)
        .dividedBy(365);
      totalDays = firstYear.plus(additionalFull).plus(additionalFraction);
    }

    // Redondeo a 2 decimales ROUND_HALF_UP en el resultado final
    const amount = dailySalary.times(totalDays).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const indemnifiedDays = totalDays.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toNumber();

    return {
      monthlySalary: monthlySalary.toFixed(2),
      dailySalary: dailySalary.toFixed(2),
      indemnifiedDays,
      amount: amount.toFixed(2),
      appliedRule,
      formulaVersion,
      inputs: {
        contractType: EmployeeContractType.INDEFINIDO,
        terminationReason: 'SIN_JUSTA_CAUSA',
        tenureYears,
        tenureDays,
        monthlySalaryVsSmlv: salaryInSmlv.toFixed(4),
        thresholdSmlv: smlvThreshold.toFixed(0),
      },
      warnings,
    };
  }

  // ── Contrato FIJO ───────────────────────────────────────────────────────

  private calcFijo(
    monthlySalary: Prisma.Decimal,
    dailySalary: Prisma.Decimal,
    agreedEndDate: Date | null,
    effectiveTerminationDate: Date,
    contractStartDate: Date,
    smlvAmount: Prisma.Decimal,
    smlvThreshold: Prisma.Decimal,
    formulaVersion: number,
    warnings: string[],
  ): IndemnificationResult {
    if (!agreedEndDate) {
      warnings.push('fijo_no_agreed_end_date — sin fecha pactada, indemnización = 0');
      return this.buildZeroResult(
        monthlySalary,
        dailySalary,
        'SIN_JUSTA_CAUSA',
        EmployeeContractType.FIJO,
        contractStartDate,
        effectiveTerminationDate,
        smlvAmount,
        smlvThreshold,
        formulaVersion,
        warnings,
      );
    }

    // Días calendario restantes hasta la fecha pactada de finalización.
    // DECISION: días calendario reales, no DAYS360 — ver nota de cabecera.
    const remainingMs = agreedEndDate.getTime() - effectiveTerminationDate.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    if (remainingDays <= 0) {
      warnings.push(
        'fijo_termination_after_agreed_end — terminación posterior a vencimiento pactado, indemnización = 0',
      );
      return this.buildZeroResult(
        monthlySalary,
        dailySalary,
        'SIN_JUSTA_CAUSA',
        EmployeeContractType.FIJO,
        contractStartDate,
        effectiveTerminationDate,
        smlvAmount,
        smlvThreshold,
        formulaVersion,
        warnings,
      );
    }

    const amount = dailySalary
      .times(remainingDays)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const { tenureYears, tenureDays } = this.calcTenure(
      contractStartDate,
      effectiveTerminationDate,
    );

    return {
      monthlySalary: monthlySalary.toFixed(2),
      dailySalary: dailySalary.toFixed(2),
      indemnifiedDays: remainingDays,
      amount: amount.toFixed(2),
      appliedRule: `FIJO:SIN_JUSTA_CAUSA — salario diario × días restantes (${remainingDays} días calendario hasta ${agreedEndDate.toISOString().slice(0, 10)})`,
      formulaVersion,
      inputs: {
        contractType: EmployeeContractType.FIJO,
        terminationReason: 'SIN_JUSTA_CAUSA',
        tenureYears,
        tenureDays,
        monthlySalaryVsSmlv: monthlySalary.dividedBy(smlvAmount).toFixed(4),
        thresholdSmlv: smlvThreshold.toFixed(0),
        agreedEndDate: agreedEndDate.toISOString().slice(0, 10),
      },
      warnings,
    };
  }

  // ── Contrato OBRA_LABOR ────────────────────────────────────────────────

  private calcObraLabor(
    monthlySalary: Prisma.Decimal,
    dailySalary: Prisma.Decimal,
    estimatedRemainingDays: number | null,
    estimatedRemainingDaysJustification: string | null,
    contractStartDate: Date,
    effectiveTerminationDate: Date,
    smlvAmount: Prisma.Decimal,
    smlvThreshold: Prisma.Decimal,
    formulaVersion: number,
    warnings: string[],
  ): IndemnificationResult {
    const MIN_DAYS = 15;

    if (estimatedRemainingDays === null || estimatedRemainingDays === undefined) {
      warnings.push(
        'obra_labor_no_estimated_days — sin días restantes estimados, se usa mínimo 15',
      );
    }

    if (!estimatedRemainingDaysJustification) {
      warnings.push(
        'obra_labor_no_justification — justificación auditable obligatoria para estimatedRemainingDays no proporcionada',
      );
    }

    const rawDays = estimatedRemainingDays ?? 0;
    // Mínimo 15 días — CST art. 64 par. 3
    const indemnifiedDays = Math.max(MIN_DAYS, rawDays);

    if (rawDays < MIN_DAYS) {
      warnings.push(
        `obra_labor_below_minimum — estimatedRemainingDays=${rawDays} < 15; se aplica mínimo legal`,
      );
    }

    const amount = dailySalary
      .times(indemnifiedDays)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const { tenureYears, tenureDays } = this.calcTenure(
      contractStartDate,
      effectiveTerminationDate,
    );

    return {
      monthlySalary: monthlySalary.toFixed(2),
      dailySalary: dailySalary.toFixed(2),
      indemnifiedDays,
      amount: amount.toFixed(2),
      appliedRule: `OBRA_LABOR:SIN_JUSTA_CAUSA — salario diario × max(15, estimatedRemainingDays=${rawDays}) = ${indemnifiedDays} días`,
      formulaVersion,
      inputs: {
        contractType: EmployeeContractType.OBRA,
        terminationReason: 'SIN_JUSTA_CAUSA',
        tenureYears,
        tenureDays,
        monthlySalaryVsSmlv: monthlySalary.dividedBy(smlvAmount).toFixed(4),
        thresholdSmlv: smlvThreshold.toFixed(0),
        estimatedRemainingDays: rawDays,
      },
      warnings,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Calcula la antigüedad en años completos + días totales + días de la fracción
   * posterior al último año completo.
   *
   * Ejemplo: 1 año + 45 días → tenureYears=1, tenureDays=410, fractionalYearDays=45
   */
  calcTenure(
    startDate: Date,
    endDate: Date,
  ): {
    tenureYears: number;
    tenureDays: number;
    fractionalYearDays: number;
  } {
    const msPerDay = 1000 * 60 * 60 * 24;
    const tenureDays = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
    const tenureYears = Math.floor(tenureDays / 365);
    const fractionalYearDays = tenureDays - tenureYears * 365;
    return { tenureYears, tenureDays, fractionalYearDays };
  }

  private buildZeroResult(
    monthlySalary: Prisma.Decimal,
    dailySalary: Prisma.Decimal,
    terminationReason: string,
    contractType: EmployeeContractType,
    contractStartDate: Date,
    effectiveTerminationDate: Date,
    smlvAmount: Prisma.Decimal,
    smlvThreshold: Prisma.Decimal,
    formulaVersion: number,
    warnings: string[],
  ): IndemnificationResult {
    const { tenureYears, tenureDays } = this.calcTenure(
      contractStartDate,
      effectiveTerminationDate,
    );

    return {
      monthlySalary: monthlySalary.toFixed(2),
      dailySalary: dailySalary.toFixed(2),
      indemnifiedDays: 0,
      amount: '0.00',
      appliedRule: `${contractType}:${terminationReason} — no genera indemnización`,
      formulaVersion,
      inputs: {
        contractType,
        terminationReason:
          terminationReason as IndemnificationResult['inputs']['terminationReason'],
        tenureYears,
        tenureDays,
        monthlySalaryVsSmlv: monthlySalary.dividedBy(smlvAmount).toFixed(4),
        thresholdSmlv: smlvThreshold.toFixed(0),
      },
      warnings,
    };
  }
}
