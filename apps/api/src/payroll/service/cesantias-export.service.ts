import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  CesantiasFundChannel,
  EmployeeDetails,
  EmployeePersonalData,
  User,
} from '@prisma/client';
import * as ExcelJS from 'exceljs';

import { AuditService } from '../../audit/service/audit.service';
import {
  CesantiasExportFileResult,
  CesantiasExportSkippedEmployee,
} from '../interfaces/cesantias-export.interfaces';
import { CesantiasLiquidationRecord } from '../interfaces/cesantias.interfaces';
import { CesantiasRepository } from '../repository/cesantias.repository';
import { PayrollRepository } from '../repository/payroll.repository';

const MIN_YEAR = 2000;

// Estructura tomada de la auditoría previa del archivo de referencia de consignación
// (no hay documentación oficial del FNA disponible en el repo — ver tasks/OS-588.md §26.2).
// No se agregan columnas que no estaban en esa referencia (NIT, periodo, encabezado,
// totales, código de administradora).
const COLUMN_HEADERS = [
  'No.',
  'Tipo ID',
  'Número ID',
  'Primer Apellido',
  'Segundo Apellido',
  'Primer Nombre',
  'Segundo Nombre',
  'Administradora',
  'Salario Mensual($)',
  'Valor a Consignar',
] as const;

type ExportEmployeeInfo = EmployeeDetails & {
  user: User;
  personalData: EmployeePersonalData | null;
};

/**
 * OS-588 (fase 3) — genera los archivos planos de consignación de cesantías (FNA y fondos
 * privados) a partir de liquidaciones YA CALCULADAS. No recalcula nada: lee
 * CesantiasLiquidation tal cual quedó persistida por CesantiasService.calculateForYear y no
 * modifica su estado. No incluye `interestAmount` — la consignación de cesantías y el pago
 * de intereses son flujos legalmente distintos (ver tasks/OS-588.md §18).
 */
@Injectable()
export class CesantiasExportService {
  constructor(
    private readonly cesantiasRepository: CesantiasRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly auditService: AuditService,
  ) {}

  async generateFnaFile(
    tenantId: string,
    year: number,
    actorUserId?: string,
  ): Promise<CesantiasExportFileResult> {
    return this.generateFile(tenantId, year, CesantiasFundChannel.FNA, 'fna', actorUserId);
  }

  async generatePrivateFundsFile(
    tenantId: string,
    year: number,
    actorUserId?: string,
  ): Promise<CesantiasExportFileResult> {
    return this.generateFile(
      tenantId,
      year,
      CesantiasFundChannel.PRIVATE_OPERATOR,
      'fondos-privados',
      actorUserId,
    );
  }

  private async generateFile(
    tenantId: string,
    year: number,
    channel: CesantiasFundChannel,
    filenamePrefix: string,
    actorUserId?: string,
  ): Promise<CesantiasExportFileResult> {
    this.assertValidYear(year);

    // Clasificación por canal: SIEMPRE el enum persistido `fundChannelSnapshot` (columna
    // real de CesantiasLiquidation, no una comparación de texto en esta capa) — nunca el
    // fondo actual del empleado. Un cambio de fondo posterior al cierre del año no debe
    // reclasificar una liquidación ya calculada. (La derivación de ESE enum, en fase 2,
    // sí compara por nombre de fondo — riesgo ya documentado en tasks/OS-588.md §16.6,
    // fuera del alcance de esta capa de exportación.)
    const allExportable = await this.cesantiasRepository.findExportableByTenantAndYear(
      tenantId,
      year,
    );
    const liquidations = allExportable.filter((l): boolean => l.fundChannelSnapshot === channel);

    const employeeIds = liquidations.map((l): string => l.employeeId);
    const employees = await this.payrollRepository.findManyWithPersonalDataByIds(
      tenantId,
      employeeIds,
    );
    const employeeById = new Map(employees.map((e): [string, ExportEmployeeInfo] => [e.id, e]));

    const skipped: CesantiasExportSkippedEmployee[] = [];
    const rows: (string | number)[][] = [];
    let rowNumber = 0;

    for (const liquidation of liquidations) {
      const employee = employeeById.get(liquidation.employeeId);
      const row = this.buildRow(rowNumber + 1, liquidation, employee);
      if (!row) {
        skipped.push({ employeeId: liquidation.employeeId, reason: 'SIN_DATOS_PERSONALES' });
        continue;
      }
      rowNumber += 1;
      rows.push(row);
    }

    const buffer = await this.buildWorkbookBuffer(rows);

    // Trazabilidad obligatoria de lo excluido — nunca silencioso (revisión previa al
    // commit de esta fase). Mismo patrón ya usado por otras exportaciones del proyecto
    // (AuditAction.EXPORT en AttendanceCollaboratorsService.exportFile) — se reutiliza la
    // infraestructura de auditoría existente, no se crea una nueva.
    await this.auditService.log({
      tenantId,
      action: AuditAction.EXPORT,
      entityType: 'CesantiasLiquidation',
      entityId: tenantId,
      actorUserId: actorUserId ?? null,
      payload: { channel, year, rowCount: rows.length, skipped },
    });

    return {
      buffer,
      filename: `cesantias-${filenamePrefix}-${year}.xlsx`,
      rowCount: rows.length,
      skipped,
    };
  }

  /**
   * Devuelve null (fila omitida, no fila con datos vacíos) cuando el empleado no tiene
   * `personalData` — no hay fuente confiable de nombre/apellidos para armar la fila sin
   * inventar un heurístico de partición sobre EmployeeDetails.name. La liquidación en sí
   * sigue existiendo en el sistema, solo no se incluye en este archivo. La omisión se
   * reporta en `skipped` (resultado del servicio), en el log de auditoría y en el header
   * `X-Cesantias-Export-Skipped-Count` de la respuesta HTTP — nunca es silenciosa (ver
   * tasks/OS-588.md §26.5).
   */
  private buildRow(
    rowNumber: number,
    liquidation: CesantiasLiquidationRecord,
    employee: ExportEmployeeInfo | undefined,
  ): (string | number)[] | null {
    if (!employee?.personalData) {
      return null;
    }
    const { personalData, user } = employee;
    if (!personalData.primerApellido && !personalData.nombres) {
      return null;
    }

    return [
      rowNumber,
      user.documentType,
      user.cedula,
      personalData.primerApellido ?? '',
      personalData.segundoApellido ?? '',
      personalData.nombres ?? '',
      // No existe un campo "segundo nombre" separado en EmployeePersonalData (`nombres` es
      // un único string combinado, confirmado exhaustivamente en tasks/OS-588.md §26.4 —
      // ninguna otra tabla del proyecto guarda el segundo nombre del EMPLEADO, solo de sus
      // beneficiarios en EmployeeSocialProfile, una persona distinta) — se deja vacío en
      // vez de partir el string por espacios, lo cual adivinaría dónde termina el nombre y
      // empieza el segundo nombre.
      '',
      liquidation.fundNameSnapshot,
      // `calculationBase` — única base salarial persistida en la liquidación, ya usada
      // para calcular `cesantiasAmount` en esta misma fila (consistencia interna
      // verificable). Puede incluir auxilio de transporte si aplicó — ver
      // tasks/OS-588.md §27.1 para la justificación completa y esa salvedad.
      liquidation.calculationBase,
      liquidation.cesantiasAmount,
    ];
  }

  private async buildWorkbookBuffer(rows: (string | number)[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Consignación');
    sheet.addRow([...COLUMN_HEADERS]).font = { bold: true };
    // Número ID e IDs de documento como texto — evita que Excel los muestre en notación
    // científica o les quite ceros a la izquierda (hallazgo del archivo de referencia
    // original, ver tasks/OS-588.md §26.2).
    sheet.getColumn(3).numFmt = '@';

    for (const row of rows) {
      sheet.addRow(row);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  private assertValidYear(year: number): void {
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear + 1) {
      throw new BadRequestException(
        `Año inválido: "${year}". Debe estar entre ${MIN_YEAR} y ${currentYear + 1}`,
      );
    }
  }
}
