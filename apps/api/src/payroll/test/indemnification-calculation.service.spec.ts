import { EmployeeContractType, Prisma } from '@prisma/client';

import type { IndemnificationInputs } from '../interfaces/final-settlement.interfaces';
import { IndemnificationCalculationService } from '../service/indemnification-calculation.service';

/**
 * OS-591 (fase 2) — Pruebas unitarias del motor puro de indemnización.
 * Cubre todas las ramas del árbol de decisión (CST art. 64).
 */
describe('IndemnificationCalculationService', (): void => {
  let service: IndemnificationCalculationService;

  // Salario de referencia < 10 SMLMV (SMLMV 2024 = ~1.300.000; 10 × = ~13.000.000)
  const LOW_SALARY = new Prisma.Decimal('2000000'); // 2.000.000 — bajo umbral
  const HIGH_SALARY = new Prisma.Decimal('14000000'); // 14.000.000 — encima del umbral
  const EXACT_THRESHOLD_SALARY = new Prisma.Decimal('13000000'); // = 10 SMLMV
  const SMLMV = new Prisma.Decimal('1300000');
  const THRESHOLD = new Prisma.Decimal('10');
  const FORMULA_VERSION = 1;

  // Fechas base
  const START = new Date('2020-01-01');
  const EXACTLY_1_YEAR = new Date('2021-01-01'); // exactamente 365 días
  const LESS_THAN_1_YEAR = new Date('2020-06-01'); // ~5 meses
  const MORE_THAN_1_YEAR = new Date('2022-07-01'); // ~2.5 años

  const baseInput = (overrides: Partial<IndemnificationInputs> = {}): IndemnificationInputs => ({
    contractType: EmployeeContractType.INDEFINIDO,
    terminationReason: 'SIN_JUSTA_CAUSA',
    contractStartDate: START,
    effectiveTerminationDate: EXACTLY_1_YEAR,
    monthlySalary: LOW_SALARY,
    smlvAmount: SMLMV,
    smlvThreshold: THRESHOLD,
    formulaVersion: FORMULA_VERSION,
    ...overrides,
  });

  beforeEach((): void => {
    service = new IndemnificationCalculationService();
  });

  // ── Causales sin indemnización ─────────────────────────────────────────────

  it.each([
    'RENUNCIA' as const,
    'JUSTA_CAUSA' as const,
    'MUTUO_ACUERDO' as const,
    'VENCIMIENTO_TERMINO' as const,
    'MUERTE_TRABAJADOR' as const,
    'OTRA' as const,
  ])('causal %s → amount=0.00', (terminationReason): void => {
    // Arrange
    const input = baseInput({ terminationReason });

    // Act
    const result = service.calculate(input);

    // Assert
    expect(result.amount).toBe('0.00');
    expect(result.indemnifiedDays).toBe(0);
    expect(result.appliedRule).toContain(terminationReason);
  });

  // ── INDEFINIDO — bajo umbral de 10 SMLMV ──────────────────────────────────

  describe('INDEFINIDO — salario < 10 SMLMV', (): void => {
    it('antigüedad < 1 año → 30 días COMPLETOS (CST art. 64, sin prorratear)', (): void => {
      // CST art. 64 (Ley 789/2002): "Treinta (30) días de salario cuando el trabajador
      // tuviere un tiempo de servicio no mayor de un (1) año." — fija el monto como
      // cantidad cerrada, no fracción proporcional. Hallazgo OS-591 Fase 2.
      // Arrange
      const terminationDate = LESS_THAN_1_YEAR; // ~5 meses

      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: terminationDate,
          monthlySalary: LOW_SALARY,
        }),
      );

      // Assert — 30 días exactos, no proporcional a los meses trabajados
      expect(result.indemnifiedDays).toBe(30);
      expect(Number(result.amount)).toBeGreaterThan(0);
      expect(result.appliedRule).toContain('INDEFINIDO_BAJO');
      expect(result.appliedRule).toContain('antigüedad < 1 año');
      expect(result.appliedRule).toContain('30 días completos');
    });

    it('antigüedad = 1 día → igual 30 días (límite inferior del primer bloque)', (): void => {
      // Verifica que incluso con 1 día de antigüedad el monto no se proporciona
      // Arrange
      const oneDayAfterStart = new Date(START);
      oneDayAfterStart.setDate(oneDayAfterStart.getDate() + 1);

      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: oneDayAfterStart,
          monthlySalary: LOW_SALARY,
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBe(30);
    });

    it('antigüedad = exactamente 1 año → 30 días completos', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: EXACTLY_1_YEAR,
          monthlySalary: LOW_SALARY,
        }),
      );

      // Assert
      // 1 año = 30 días base; fracción de días = (366-365)/365 ≈ 0.05 (2020 es bisiesto)
      // Se acepta hasta ± 0.15 días de diferencia
      expect(result.indemnifiedDays).toBeCloseTo(30, 0);
      expect(result.appliedRule).toContain('INDEFINIDO_BAJO');
    });

    it('antigüedad > 1 año → 30 + proporcional (20 días/año adicional)', (): void => {
      // Arrange — 2.5 años ≈ 2 años completos + 183 días fracción
      const { tenureYears, fractionalYearDays } = service.calcTenure(START, MORE_THAN_1_YEAR);
      // Esperado: 30 + (2-1)*20 + 20*(fractionalYearDays/365)
      const expectedDays = 30 + (tenureYears - 1) * 20 + (20 * fractionalYearDays) / 365;

      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: MORE_THAN_1_YEAR,
          monthlySalary: LOW_SALARY,
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBeCloseTo(expectedDays, 2);
      expect(result.appliedRule).toContain('INDEFINIDO_BAJO');
    });
  });

  // ── INDEFINIDO — exactamente en el umbral de 10 SMLMV ─────────────────────

  describe('INDEFINIDO — salario exactamente en umbral de 10 SMLMV', (): void => {
    it('salario = 10 SMLMV → aplica tabla ALTO (≥ umbral)', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: EXACTLY_1_YEAR,
          monthlySalary: EXACT_THRESHOLD_SALARY,
        }),
      );

      // Assert
      expect(result.appliedRule).toContain('INDEFINIDO_ALTO');
      // 1 año completo: 20 días base
      expect(result.indemnifiedDays).toBeCloseTo(20, 1);
    });
  });

  // ── INDEFINIDO — salario >= 10 SMLMV ──────────────────────────────────────

  describe('INDEFINIDO — salario >= 10 SMLMV', (): void => {
    it('antigüedad = 1 año → 20 días', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: EXACTLY_1_YEAR,
          monthlySalary: HIGH_SALARY,
        }),
      );

      // Assert
      expect(result.appliedRule).toContain('INDEFINIDO_ALTO');
      expect(result.indemnifiedDays).toBeCloseTo(20, 1);
    });

    it('antigüedad > 1 año → 20 + proporcional (15 días/año adicional)', (): void => {
      // Arrange
      const { tenureYears, fractionalYearDays } = service.calcTenure(START, MORE_THAN_1_YEAR);
      const expectedDays = 20 + (tenureYears - 1) * 15 + (15 * fractionalYearDays) / 365;

      // Act
      const result = service.calculate(
        baseInput({
          effectiveTerminationDate: MORE_THAN_1_YEAR,
          monthlySalary: HIGH_SALARY,
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBeCloseTo(expectedDays, 2);
      expect(result.appliedRule).toContain('INDEFINIDO_ALTO');
    });
  });

  // ── Contrato FIJO ──────────────────────────────────────────────────────────

  describe('FIJO', (): void => {
    it('sin agreedEndDate → warning y amount=0', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.FIJO,
          agreedEndDate: null,
        }),
      );

      // Assert
      expect(result.amount).toBe('0.00');
      expect(result.warnings).toContainEqual(expect.stringContaining('fijo_no_agreed_end_date'));
    });

    it('agreedEndDate antes de effectiveTerminationDate → amount=0', (): void => {
      // Arrange
      const agreedEndDate = new Date('2020-12-31');
      const effectiveTerminationDate = new Date('2021-01-15'); // posterior al vencimiento

      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.FIJO,
          agreedEndDate,
          effectiveTerminationDate,
        }),
      );

      // Assert
      expect(result.amount).toBe('0.00');
      expect(result.warnings.some((w): boolean => w.includes('termination_after_agreed_end'))).toBe(
        true,
      );
    });

    it('días restantes reales → amount = dailySalary × remainingDays', (): void => {
      // Arrange
      const agreedEndDate = new Date('2021-06-30');
      const effectiveTerminationDate = new Date('2021-01-01'); // 180 días antes del vencimiento
      const remainingDays = Math.ceil(
        (agreedEndDate.getTime() - effectiveTerminationDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const expectedAmount = (Number(LOW_SALARY) / 30) * remainingDays;

      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.FIJO,
          agreedEndDate,
          effectiveTerminationDate,
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBe(remainingDays);
      expect(Number(result.amount)).toBeCloseTo(expectedAmount, 0);
      expect(result.appliedRule).toContain('FIJO:SIN_JUSTA_CAUSA');
    });
  });

  // ── Contrato OBRA ──────────────────────────────────────────────────────────

  describe('OBRA (OBRA_LABOR)', (): void => {
    it('sin estimatedRemainingDays → usa mínimo 15 días con warning', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.OBRA,
          estimatedRemainingDays: null,
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBe(15);
      expect(result.warnings.some((w): boolean => w.includes('obra_labor_no_estimated_days'))).toBe(
        true,
      );
    });

    it('estimatedRemainingDays < 15 → aplica mínimo legal de 15', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.OBRA,
          estimatedRemainingDays: 8,
          estimatedRemainingDaysJustification: 'Obra casi terminada',
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBe(15);
      expect(result.warnings.some((w): boolean => w.includes('obra_labor_below_minimum'))).toBe(
        true,
      );
    });

    it('estimatedRemainingDays >= 15 → usa el valor real', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.OBRA,
          estimatedRemainingDays: 45,
          estimatedRemainingDaysJustification: 'Obra con tres fases restantes',
        }),
      );

      // Assert
      expect(result.indemnifiedDays).toBe(45);
    });

    it('sin justificación → warning obligatoria', (): void => {
      // Act
      const result = service.calculate(
        baseInput({
          contractType: EmployeeContractType.OBRA,
          estimatedRemainingDays: 20,
          estimatedRemainingDaysJustification: null,
        }),
      );

      // Assert
      expect(result.warnings.some((w): boolean => w.includes('obra_labor_no_justification'))).toBe(
        true,
      );
    });
  });

  // ── Aislamiento multi-tenant: el motor es puro, no hay tenant en los inputs ─

  it('produce el mismo resultado sin importar cuántas veces se llame (determinismo)', (): void => {
    // Arrange
    const input = baseInput({ effectiveTerminationDate: MORE_THAN_1_YEAR });

    // Act
    const r1 = service.calculate(input);
    const r2 = service.calculate(input);

    // Assert
    expect(r1.amount).toBe(r2.amount);
    expect(r1.indemnifiedDays).toBe(r2.indemnifiedDays);
  });

  // ── Snapshot de versión de fórmula ────────────────────────────────────────

  it('incluye formulaVersion en el resultado', (): void => {
    // Act
    const result = service.calculate(baseInput({ formulaVersion: 2 }));

    // Assert
    expect(result.formulaVersion).toBe(2);
  });
});
