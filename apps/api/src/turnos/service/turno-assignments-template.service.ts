import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import type { GenerateTemplateOptions } from '../interfaces/turno-assignments-bulk.interfaces';
import type { ActorContext } from '../interfaces/turno-assignments.interfaces';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { TurnosRepository } from '../repository/turnos.repository';
import { daysBetween, expandDatesInRange, formatDateOnly } from '../turno-assignments.utils';
import {
  BULK_AVAILABLE_TURNOS_COLUMNS,
  BULK_AVAILABLE_TURNOS_SHEET_NAME,
  BULK_BASE_VALUE,
  BULK_IMPORT_SHEET_NAME,
  BULK_REST_VALUE,
  BULK_TEMPLATE_COLUMNS,
  BULK_TEMPLATE_MAX_RANGE_DAYS,
} from '../turnos.constants';
import { startOfTodayUtc } from '../turnos.utils';
import { TurnoAssignmentsService } from './turno-assignments.service';
import { solidFill, TURNOS_EXCEL_DARK_BLUE, TURNOS_EXCEL_WHITE } from './turnos-excel.service';

interface WorksheetDataValidations {
  dataValidations: { add: (address: string, validation: ExcelJS.DataValidation) => void };
}

interface TemplateEmployee {
  id: string;
  nombre: string;
  documento: string;
}

interface TemplateTurno {
  nombre: string;
  sigla: string;
  horaInicio: string;
  horaFin: string;
  jornada: string;
}

@Injectable()
export class TurnoAssignmentsTemplateService {
  constructor(
    private readonly assignmentsRepository: TurnoAssignmentsRepository,
    private readonly turnosRepository: TurnosRepository,
    private readonly assignmentsService: TurnoAssignmentsService,
  ) {}

  async generateTemplate(
    tenantId: string,
    actor: ActorContext,
    options: GenerateTemplateOptions,
  ): Promise<{ buffer: Buffer; filename: string }> {
    this.validateRange(options, actor);

    if (options.employeeIds.length === 0) {
      throw new BadRequestException('Debes seleccionar al menos un colaborador');
    }
    if (options.weekdaysIso.length === 0) {
      throw new BadRequestException('Debes seleccionar al menos un día de la semana');
    }

    const employees = await this.assignmentsRepository.findEmployeesByIds(
      tenantId,
      options.employeeIds,
    );
    const foundIds = new Set(employees.map((employee): string => employee.id));
    const missing = options.employeeIds.filter((id): boolean => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Colaborador(es) no encontrado(s) en el tenant: ${missing.join(', ')}`,
      );
    }

    const inactive = employees.filter((employee): boolean => !employee.isActive);
    if (inactive.length > 0) {
      throw new ConflictException(
        `Colaborador(es) inactivo(s): ${inactive.map((employee): string => employee.nombre).join(', ')}`,
      );
    }

    const allowedLocationIds = await this.assignmentsService.resolveScope(tenantId, actor);
    if (allowedLocationIds) {
      const outOfScope = employees.filter(
        (employee): boolean =>
          !employee.locationId || !allowedLocationIds.includes(employee.locationId),
      );
      if (outOfScope.length > 0) {
        throw new ForbiddenException(
          `Colaborador(es) fuera de tu(s) sede(s) asignada(s): ${outOfScope.map((employee): string => employee.nombre).join(', ')}`,
        );
      }
    }

    const turnosActivos = await this.turnosRepository.findAllFiltered(tenantId, { estado: true });
    const dates = expandDatesInRange(options.from, options.to, options.weekdaysIso);

    const buffer = await this.buildWorkbook(employees, dates, turnosActivos);

    await this.assignmentsRepository.logTemplateExportAudit(tenantId, actor.userId, {
      from: formatDateOnly(options.from),
      to: formatDateOnly(options.to),
      weekdaysIso: options.weekdaysIso,
      employeeCount: employees.length,
      dateCount: dates.length,
    });

    const filename = `plantilla_turnos_${formatDateOnly(options.from)}_${formatDateOnly(options.to)}.xlsx`;
    return { buffer, filename };
  }

  private validateRange(options: GenerateTemplateOptions, actor: ActorContext): void {
    if (options.to.getTime() < options.from.getTime()) {
      throw new BadRequestException('La fecha "hasta" debe ser mayor o igual a la fecha "desde"');
    }

    const rangeDays = daysBetween(options.from, options.to);
    if (rangeDays > BULK_TEMPLATE_MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `El rango de fechas no puede superar ${BULK_TEMPLATE_MAX_RANGE_DAYS} días`,
      );
    }

    const isPast = options.from.getTime() < startOfTodayUtc().getTime();
    const isAdmin = actor.roleCode === 'OWNER' || actor.roleCode === 'SUPER_ADMIN';
    if (isPast && !isAdmin) {
      throw new ForbiddenException(
        'No se puede generar una plantilla con fecha de inicio en el pasado',
      );
    }
  }

  private async buildWorkbook(
    employees: TemplateEmployee[],
    dates: Date[],
    turnosActivos: TemplateTurno[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    const dateColumnKeys = dates.map((date): string => formatDateOnly(date));

    const sheet = workbook.addWorksheet(BULK_IMPORT_SHEET_NAME, {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    sheet.columns = [
      { header: BULK_TEMPLATE_COLUMNS.documento, key: 'documento', width: 18 },
      { header: BULK_TEMPLATE_COLUMNS.nombre, key: 'nombre', width: 32 },
      { header: BULK_TEMPLATE_COLUMNS.employeeId, key: 'employeeId', width: 28, hidden: true },
      ...dateColumnKeys.map((key): { header: string; key: string; width: number } => ({
        header: key,
        key,
        width: 14,
      })),
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: TURNOS_EXCEL_WHITE };
    headerRow.fill = solidFill(TURNOS_EXCEL_DARK_BLUE);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    employees.forEach((employee): void => {
      sheet.addRow({
        documento: employee.documento,
        nombre: employee.nombre,
        employeeId: employee.id,
      });
    });

    const availableSheet = workbook.addWorksheet(BULK_AVAILABLE_TURNOS_SHEET_NAME);
    availableSheet.columns = BULK_AVAILABLE_TURNOS_COLUMNS.map(
      (label): { header: string; width: number } => ({
        header: label,
        width: label === 'Nombre' ? 32 : 16,
      }),
    );

    const availableHeaderRow = availableSheet.getRow(1);
    availableHeaderRow.values = [...BULK_AVAILABLE_TURNOS_COLUMNS];
    availableHeaderRow.font = { bold: true, color: TURNOS_EXCEL_WHITE };
    availableHeaderRow.fill = solidFill(TURNOS_EXCEL_DARK_BLUE);
    availableHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

    turnosActivos.forEach((turno): void => {
      availableSheet.addRow([
        turno.nombre,
        turno.sigla,
        turno.horaInicio,
        turno.horaFin,
        turno.jornada,
      ]);
    });
    availableSheet.addRow([
      'Descanso + Turno Base (elimina la asignación explícita)',
      BULK_BASE_VALUE,
      '',
      '',
      '',
    ]);
    availableSheet.addRow(['Descanso explícito', BULK_REST_VALUE, '', '', '']);

    const lastSiglaRow = turnosActivos.length + 3; // header + turnos activos + BASE + DESCANSO
    const siglaRange = `'${BULK_AVAILABLE_TURNOS_SHEET_NAME}'!$B$2:$B$${lastSiglaRow}`;
    const worksheetWithValidations = sheet as unknown as WorksheetDataValidations;

    for (let rowIndex = 2; rowIndex <= employees.length + 1; rowIndex += 1) {
      dateColumnKeys.forEach((_, columnOffset): void => {
        const column = sheet.getColumn(4 + columnOffset);
        const cellRef = `${column.letter}${rowIndex}`;
        worksheetWithValidations.dataValidations.add(cellRef, {
          type: 'list',
          allowBlank: true,
          formulae: [siglaRange],
          showErrorMessage: true,
          errorTitle: 'Valor inválido',
          error: 'Selecciona una sigla de turno activo, BASE o DESCANSO de la lista.',
        });
      });
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
