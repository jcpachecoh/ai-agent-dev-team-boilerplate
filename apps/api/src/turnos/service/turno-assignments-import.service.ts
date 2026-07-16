import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TurnoAssignmentType } from '@prisma/client';
import * as ExcelJS from 'exceljs';

import type { BulkImportResult } from '../interfaces/turno-assignments-bulk.interfaces';
import type { ActorContext, EmployeeScopeInfo } from '../interfaces/turno-assignments.interfaces';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { TurnosRepository } from '../repository/turnos.repository';
import { DATE_ONLY_REGEX, parseDateOnly } from '../turno-assignments.utils';
import {
  BULK_BASE_VALUE,
  BULK_IMPORT_MAX_ASSIGNMENTS,
  BULK_IMPORT_SHEET_NAME,
  BULK_REST_VALUE_ALIASES,
  BULK_TEMPLATE_COLUMNS,
  SCOPE_FORBIDDEN_MESSAGE,
} from '../turnos.constants';
import { TurnoAssignmentsService } from './turno-assignments.service';

class BulkImportAllFailedException extends BadRequestException {
  constructor(result: BulkImportResult) {
    super({ message: 'Todas las filas del archivo fallaron', ...result });
  }
}

interface DateColumn {
  column: number;
  date: Date;
  dateStr: string;
}

@Injectable()
export class TurnoAssignmentsImportService {
  constructor(
    private readonly assignmentsRepository: TurnoAssignmentsRepository,
    private readonly turnosRepository: TurnosRepository,
    private readonly assignmentsService: TurnoAssignmentsService,
  ) {}

  async importFromExcel(
    tenantId: string,
    actor: ActorContext,
    buffer: Buffer,
  ): Promise<BulkImportResult> {
    const sheet = await this.loadSheet(buffer);
    const { documentoCol, employeeIdCol, dateColumns } = this.readHeaders(sheet);
    const allowedLocationIds = await this.assignmentsService.resolveScope(tenantId, actor);

    const dataRowNumbers = this.collectDataRows(sheet, documentoCol, employeeIdCol);
    this.assertWithinMaxAssignments(sheet, dataRowNumbers, dateColumns);

    const result: BulkImportResult = {
      totalRows: 0,
      totalAssignments: 0,
      createdOrUpdated: 0,
      returnedToBase: 0,
      restDays: 0,
      excluded: 0,
      errorCount: 0,
      errors: [],
    };

    for (const rowNumber of dataRowNumbers) {
      result.totalRows += 1;
      await this.processRow(
        tenantId,
        actor,
        sheet.getRow(rowNumber),
        rowNumber,
        documentoCol,
        employeeIdCol,
        dateColumns,
        allowedLocationIds,
        result,
      );
    }

    if (result.totalAssignments === 0 && result.errorCount > 0) {
      throw new BulkImportAllFailedException(result);
    }

    return result;
  }

  private async loadSheet(buffer: Buffer): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    try {
      // exceljs@4 declara su propio tipo Buffer que no coincide estructuralmente con el de
      // @types/node más reciente (mismatch conocido del paquete); el cast es seguro en runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException('No se pudo leer el archivo Excel');
    }

    const sheet = workbook.getWorksheet(BULK_IMPORT_SHEET_NAME);
    if (!sheet) {
      throw new BadRequestException(
        `El archivo debe tener una hoja llamada "${BULK_IMPORT_SHEET_NAME}"`,
      );
    }
    return sheet;
  }

  private readHeaders(sheet: ExcelJS.Worksheet): {
    documentoCol?: number;
    employeeIdCol?: number;
    dateColumns: DateColumn[];
  } {
    const columnIndexByHeader = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, colNumber): void => {
      const value = String(cell.value ?? '').trim();
      if (value) {
        columnIndexByHeader.set(value, colNumber);
      }
    });

    const documentoCol = columnIndexByHeader.get(BULK_TEMPLATE_COLUMNS.documento);
    const employeeIdCol = columnIndexByHeader.get(BULK_TEMPLATE_COLUMNS.employeeId);

    if (!documentoCol && !employeeIdCol) {
      throw new BadRequestException(
        `El archivo debe incluir la columna "${BULK_TEMPLATE_COLUMNS.documento}" o "${BULK_TEMPLATE_COLUMNS.employeeId}"`,
      );
    }

    const dateColumns: DateColumn[] = [];
    columnIndexByHeader.forEach((column, header): void => {
      if (DATE_ONLY_REGEX.test(header)) {
        dateColumns.push({ column, date: parseDateOnly(header), dateStr: header });
      }
    });

    if (dateColumns.length === 0) {
      throw new BadRequestException('El archivo no tiene columnas de fecha (formato YYYY-MM-DD)');
    }

    return { documentoCol, employeeIdCol, dateColumns };
  }

  private collectDataRows(
    sheet: ExcelJS.Worksheet,
    documentoCol?: number,
    employeeIdCol?: number,
  ): number[] {
    const rowNumbers: number[] = [];
    sheet.eachRow((row, rowNumber): void => {
      if (rowNumber === 1) {
        return;
      }
      const documento = documentoCol ? this.cellText(row, documentoCol) : '';
      const employeeId = employeeIdCol ? this.cellText(row, employeeIdCol) : '';
      if (documento || employeeId) {
        rowNumbers.push(rowNumber);
      }
    });
    return rowNumbers;
  }

  private assertWithinMaxAssignments(
    sheet: ExcelJS.Worksheet,
    dataRowNumbers: number[],
    dateColumns: DateColumn[],
  ): void {
    let actionableCells = 0;
    for (const rowNumber of dataRowNumbers) {
      const row = sheet.getRow(rowNumber);
      for (const dateColumn of dateColumns) {
        if (this.cellText(row, dateColumn.column)) {
          actionableCells += 1;
        }
      }
    }
    if (actionableCells > BULK_IMPORT_MAX_ASSIGNMENTS) {
      throw new BadRequestException(
        `El archivo supera el máximo de ${BULK_IMPORT_MAX_ASSIGNMENTS} asignaciones procesables (tiene ${actionableCells})`,
      );
    }
  }

  private async processRow(
    tenantId: string,
    actor: ActorContext,
    row: ExcelJS.Row,
    rowNumber: number,
    documentoCol: number | undefined,
    employeeIdCol: number | undefined,
    dateColumns: DateColumn[],
    allowedLocationIds: string[] | null,
    result: BulkImportResult,
  ): Promise<void> {
    const documento = documentoCol ? this.cellText(row, documentoCol) : '';
    const employeeIdValue = employeeIdCol ? this.cellText(row, employeeIdCol) : '';
    const rowLabel = documento || employeeIdValue || `fila ${rowNumber}`;

    const employee = await this.resolveEmployee(tenantId, employeeIdValue, documento);
    if (!employee) {
      result.errorCount += 1;
      result.errors.push({
        row: rowNumber,
        employee: rowLabel,
        reason: 'Colaborador no encontrado',
      });
      return;
    }

    // Rotante (sin sede fija): un actor acotado por sede no tiene forma de validar
    // pertenencia contra una sede estática — se excluye por defecto (fail-closed).
    if (
      allowedLocationIds &&
      (!employee.locationId || !allowedLocationIds.includes(employee.locationId))
    ) {
      result.excluded += 1;
      result.errors.push({ row: rowNumber, employee: rowLabel, reason: SCOPE_FORBIDDEN_MESSAGE });
      return;
    }

    if (!employee.isActive) {
      result.errorCount += 1;
      result.errors.push({ row: rowNumber, employee: rowLabel, reason: 'Colaborador inactivo' });
      return;
    }

    for (const dateColumn of dateColumns) {
      const raw = this.cellText(row, dateColumn.column);
      if (!raw) {
        continue;
      }

      try {
        await this.processCell(
          tenantId,
          actor,
          employee.id,
          dateColumn,
          raw,
          rowNumber,
          rowLabel,
          result,
        );
      } catch (error) {
        this.recordCellError(result, rowNumber, rowLabel, dateColumn.dateStr, error);
      }
    }
  }

  private async processCell(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
    dateColumn: DateColumn,
    raw: string,
    rowNumber: number,
    rowLabel: string,
    result: BulkImportResult,
  ): Promise<void> {
    const normalized = raw.trim().toUpperCase();

    if (normalized === BULK_BASE_VALUE) {
      const existing = await this.assignmentsRepository.findByEmployeeAndDate(
        tenantId,
        employeeId,
        dateColumn.date,
      );
      if (existing) {
        await this.assignmentsService.remove(tenantId, actor, existing.id);
        result.returnedToBase += 1;
        result.totalAssignments += 1;
      }
      return;
    }

    if ((BULK_REST_VALUE_ALIASES as readonly string[]).includes(normalized)) {
      await this.assignmentsService.assign(tenantId, actor, {
        employeeId,
        workDate: dateColumn.dateStr,
        type: TurnoAssignmentType.REST,
      });
      result.restDays += 1;
      result.totalAssignments += 1;
      return;
    }

    const turno = await this.turnosRepository.findBySigla(tenantId, normalized);
    if (!turno) {
      result.errorCount += 1;
      result.errors.push({
        row: rowNumber,
        employee: rowLabel,
        date: dateColumn.dateStr,
        reason: `Turno con sigla "${raw}" no encontrado`,
      });
      return;
    }
    if (!turno.estado) {
      result.errorCount += 1;
      result.errors.push({
        row: rowNumber,
        employee: rowLabel,
        date: dateColumn.dateStr,
        reason: `Turno "${raw}" está inactivo`,
      });
      return;
    }

    await this.assignmentsService.assign(tenantId, actor, {
      employeeId,
      workDate: dateColumn.dateStr,
      turnoId: turno.id,
    });
    result.createdOrUpdated += 1;
    result.totalAssignments += 1;
  }

  private recordCellError(
    result: BulkImportResult,
    row: number,
    employee: string,
    date: string,
    error: unknown,
  ): void {
    if (error instanceof ForbiddenException && error.message === SCOPE_FORBIDDEN_MESSAGE) {
      result.excluded += 1;
      result.errors.push({ row, employee, date, reason: error.message });
      return;
    }
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException
    ) {
      result.errorCount += 1;
      result.errors.push({ row, employee, date, reason: error.message });
      return;
    }
    if (error instanceof HttpException) {
      result.errorCount += 1;
      result.errors.push({ row, employee, date, reason: error.message });
      return;
    }
    throw error;
  }

  private async resolveEmployee(
    tenantId: string,
    employeeIdValue: string,
    documento: string,
  ): Promise<EmployeeScopeInfo | null> {
    if (employeeIdValue) {
      const byId = await this.assignmentsRepository.findEmployeeScope(tenantId, employeeIdValue);
      if (byId) {
        return byId;
      }
    }
    if (documento) {
      const byDocument = await this.assignmentsRepository.findEmployeeByDocument(
        tenantId,
        documento,
      );
      if (byDocument) {
        return byDocument;
      }
    }
    return null;
  }

  private cellText(row: ExcelJS.Row, column: number): string {
    const value: unknown = row.getCell(column).value;
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object' && 'text' in (value as Record<string, unknown>)) {
      return String((value as { text: unknown }).text ?? '').trim();
    }
    return String(value).trim();
  }
}
