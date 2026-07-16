import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { DailyCostCenterRepository } from '../repository/daily-cost-center.repository';
import type {
  IRotanteProrationService,
  RotanteProrationAllocation,
  RotanteProrationInput,
  RotanteProrationResult,
} from '../interfaces/rotante-proration.interfaces';

/**
 * CONN-06 — Task 07: prorratea el costo laboral de un período entre las sedes reales
 * donde trabajó un empleado ROTANTE, según días_sede / días_totales (PC-3).
 * La última sede (por locationId) absorbe el remanente de redondeo de centavos.
 */
@Injectable()
export class RotanteProrationService implements IRotanteProrationService {
  constructor(private readonly repository: DailyCostCenterRepository) {}

  async prorate(input: RotanteProrationInput): Promise<RotanteProrationResult> {
    const [assignments, pendingDays] = await Promise.all([
      this.repository.findByTenantAndDateRange(input.tenantId, input.periodStart, input.periodEnd, {
        employeeId: input.employeeId,
      }),
      this.repository.findPendingDays(
        input.tenantId,
        input.employeeId,
        input.periodStart,
        input.periodEnd,
      ),
    ]);

    const totalDaysAssigned = assignments.length;
    const pendingDaysCount = pendingDays.length;

    if (totalDaysAssigned === 0) {
      return {
        employeeId: input.employeeId,
        totalDaysAssigned: 0,
        pendingDaysCount,
        allocations: [],
      };
    }

    const daysByLocation = new Map<string, { locationName: string; days: number }>();
    for (const assignment of assignments) {
      const existing = daysByLocation.get(assignment.locationId);
      if (existing) {
        existing.days += 1;
      } else {
        daysByLocation.set(assignment.locationId, {
          locationName: assignment.locationName,
          days: 1,
        });
      }
    }

    const totalCost = new Decimal(input.totalLaborCost);
    const entries = [...daysByLocation.entries()].sort(([a], [b]) => a.localeCompare(b));

    let allocatedSoFar = new Decimal(0);
    const allocations: RotanteProrationAllocation[] = entries.map(
      ([locationId, { locationName, days }], index) => {
        const isLast = index === entries.length - 1;
        const proportion = days / totalDaysAssigned;
        const proratedCost = isLast
          ? totalCost.minus(allocatedSoFar)
          : totalCost.times(days).dividedBy(totalDaysAssigned).toDecimalPlaces(2);

        if (!isLast) {
          allocatedSoFar = allocatedSoFar.plus(proratedCost);
        }

        return {
          locationId,
          locationName,
          days,
          proportion,
          proratedCost: proratedCost.toNumber(),
        };
      },
    );

    return {
      employeeId: input.employeeId,
      totalDaysAssigned,
      pendingDaysCount,
      allocations,
    };
  }
}
