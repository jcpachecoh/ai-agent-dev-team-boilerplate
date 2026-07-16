import type {
  ContractTerminationReason,
  EmployeeContractType,
  EmploymentContractStatus,
  Prisma,
} from '@prisma/client';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type EmploymentContractRecord = {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  contractType: EmployeeContractType;
  startDate: Date;
  agreedEndDate: Date | null;
  status: EmploymentContractStatus;
  terminationDate: Date | null;
  terminationReason: ContractTerminationReason | null;
  terminationNotes: string | null;
  activeSlot: boolean | null;
  changedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateInitialContractData = {
  tenantId: string;
  employeeDetailsId: string;
  contractType: EmployeeContractType;
  startDate: Date;
  agreedEndDate: Date | null;
  changedBy?: string;
};

/**
 * OS-591 (fase 1) — patch aplicado al contrato ACTIVO vigente cuando el flujo genérico de
 * `PayrollService.update` trae `contractType`/`contractStart`/`contractEnd`. Esto NO crea
 * un nuevo contrato (no es una recontratación) — solo corrige/ajusta el contrato que ya
 * está en curso, igual criterio que EmployeeSalaryHistory.syncSalaryHistoryTx pero
 * mutando el registro abierto en vez de cerrar uno y abrir otro (aquí no aplica: el
 * contrato sigue siendo el mismo, solo cambian sus atributos pactados).
 */
export type SyncActiveContractData = {
  tenantId: string;
  employeeDetailsId: string;
  contractType?: EmployeeContractType;
  startDate?: Date;
  agreedEndDate?: Date | null;
  changedBy?: string;
};

export type TerminateContractData = {
  tenantId: string;
  employeeDetailsId: string;
  terminationDate: Date;
  terminationReason: ContractTerminationReason;
  terminationNotes?: string | null;
  changedBy?: string;
};

export type StartNewContractData = {
  tenantId: string;
  employeeDetailsId: string;
  contractType: EmployeeContractType;
  startDate: Date;
  agreedEndDate?: Date | null;
  changedBy?: string;
};

export interface IEmployeeContractRepository {
  findActiveContract(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord | null>;
  findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord[]>;
  findById(tenantId: string, id: string): Promise<EmploymentContractRecord | null>;
  /**
   * Contrato vigente en `asOfDate` — el que estaba ACTIVO en esa fecha, o el TERMINADO cuya
   * ventana [startDate, terminationDate] la cubre. Usado por la fase 2 para saber qué
   * contrato "originó" una liquidación calculada a una fecha pasada.
   */
  findContractAt(
    tenantId: string,
    employeeDetailsId: string,
    asOfDate: Date,
  ): Promise<EmploymentContractRecord | null>;
  /**
   * OS-599 — contratos vigentes en `asOfDate` para todo el tenant (1 query).
   * Un registro por `employeeDetailsId` (el de `startDate` más reciente que cubre la fecha).
   */
  findContractsAsOfForTenant(tenantId: string, asOfDate: Date): Promise<EmploymentContractRecord[]>;
  createInitialContractTx(
    tx: Prisma.TransactionClient,
    data: CreateInitialContractData,
  ): Promise<EmploymentContractRecord>;
  /** No-op si ninguno de contractType/startDate/agreedEndDate vino en el patch. */
  syncActiveContractTx(tx: Prisma.TransactionClient, data: SyncActiveContractData): Promise<void>;
  terminateActiveContractTx(
    tx: Prisma.TransactionClient,
    data: TerminateContractData,
  ): Promise<EmploymentContractRecord>;
  startNewContractTx(
    tx: Prisma.TransactionClient,
    data: StartNewContractData,
  ): Promise<EmploymentContractRecord>;
}

export interface IEmployeeContractService {
  getActiveContract(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmploymentContractRecord | null>;
  listByEmployee(tenantId: string, employeeDetailsId: string): Promise<EmploymentContractRecord[]>;
  /**
   * Cierra el contrato ACTIVO con fecha y causal. Desde OS-591 fase 3, invocado por
   * `FinalSettlementService.approve()` al aprobar una liquidación — ese es el momento
   * exacto de terminación contractual (ver tasks/OS-591.md §15.4). También deja al
   * empleado `isActive=false` (efecto transaccional en `terminateActiveContractTx`).
   */
  terminateActiveContract(
    tenantId: string,
    employeeDetailsId: string,
    data: {
      terminationDate: Date;
      terminationReason: ContractTerminationReason;
      terminationNotes?: string;
    },
    changedBy?: string,
  ): Promise<EmploymentContractRecord>;
  /**
   * Nueva contratación — requiere que NO exista un contrato ACTIVO (si lo hay, primero debe
   * terminarse). Refuerza en la capa de servicio la misma regla que ya garantiza el
   * `@@unique([tenantId, employeeDetailsId, activeSlot])` en base de datos.
   */
  rehire(
    tenantId: string,
    employeeDetailsId: string,
    data: {
      contractType: EmployeeContractType;
      startDate: Date;
      agreedEndDate?: Date | null;
    },
    changedBy?: string,
  ): Promise<EmploymentContractRecord>;
}
