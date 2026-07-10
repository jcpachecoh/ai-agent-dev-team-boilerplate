import type { EmployeeCatalogType, Prisma, SalaryType } from '@prisma/client';

/** OS-588 — subconjunto de EmployeeCatalogType válido para EmployeeFundHistory.fundType. */
export type EmployeeFundHistoryType =
  | typeof EmployeeCatalogType.CESANTIAS_FUND
  | typeof EmployeeCatalogType.PENSION_FUND;

// `type`, no `interface` — son formas de datos planas (no las implementa ninguna clase,
// no usan herencia), y la regla naming-convention del proyecto solo exige prefijo `I` en
// `interface`, no en `type` (ver apps/api/.eslintrc.json). Evita el prefijo sin perder
// nada: mismo chequeo estructural, misma forma, cero comportamiento distinto.
export type EmployeeSalaryHistoryRecord = {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  salaryType: SalaryType;
  salaryAmount: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string | null;
  createdAt: Date;
};

export type EmployeeFundHistoryRecord = {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  fundType: EmployeeFundHistoryType;
  fundName: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string | null;
  createdAt: Date;
};

export type SyncSalaryHistoryData = {
  tenantId: string;
  employeeDetailsId: string;
  salaryType: SalaryType;
  salaryAmount: Prisma.Decimal | number;
  effectiveFrom: Date;
  changedBy?: string;
};

export type SyncFundHistoryData = {
  tenantId: string;
  employeeDetailsId: string;
  fundType: EmployeeFundHistoryType;
  fundName: string;
  effectiveFrom: Date;
  changedBy?: string;
};

export interface IEmployeeHistoryRepository {
  findSalaryHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSalaryHistoryRecord[]>;
  findFundHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
    fundType?: EmployeeFundHistoryType,
  ): Promise<EmployeeFundHistoryRecord[]>;
  /**
   * OS-588 (fase 2) — versión batch de findSalaryHistoryByEmployee para evitar N+1 al
   * calcular cesantías de un tenant completo en una sola corrida. Agrupa por
   * employeeDetailsId en memoria (una sola query a la base de datos).
   */
  findSalaryHistoryByEmployees(
    tenantId: string,
    employeeDetailsIds: string[],
  ): Promise<Map<string, EmployeeSalaryHistoryRecord[]>>;
  /** Igual que findSalaryHistoryByEmployees, para fondos. */
  findFundHistoryByEmployees(
    tenantId: string,
    employeeDetailsIds: string[],
    fundType?: EmployeeFundHistoryType,
  ): Promise<Map<string, EmployeeFundHistoryRecord[]>>;
  /**
   * Cierra (si existe) el registro salarial abierto y crea uno nuevo, únicamente si el
   * valor efectivo cambió. Debe ejecutarse dentro de la misma transacción Prisma que el
   * `employeeDetails.update`/`create` que la origina — por eso recibe `tx` en vez de usar
   * `this.prisma` directamente (mismo patrón que `CommitteeRepository.incrementOrdersCountTx`).
   */
  syncSalaryHistoryTx(tx: Prisma.TransactionClient, data: SyncSalaryHistoryData): Promise<void>;
  /** Igual que `syncSalaryHistoryTx`, para un `fundType` puntual (CESANTIAS_FUND | PENSION_FUND). */
  syncFundHistoryTx(tx: Prisma.TransactionClient, data: SyncFundHistoryData): Promise<void>;
}

export interface IEmployeeHistoryService {
  getSalaryHistory(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSalaryHistoryRecord[]>;
  getFundHistory(
    tenantId: string,
    employeeDetailsId: string,
    fundType?: EmployeeFundHistoryType,
  ): Promise<EmployeeFundHistoryRecord[]>;
}
