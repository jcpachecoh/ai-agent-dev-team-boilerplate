// `type`, no `interface` — ver nota en employee-history.interfaces.ts.

/**
 * OS-588 (fase 3, revisión previa a commit) — únicamente razón implementada hoy: la
 * liquidación es exportable pero el empleado no tiene `EmployeePersonalData`, o la tiene
 * sin `primerApellido` ni `nombres` (sin fuente confiable de nombre para la fila).
 */
export type CesantiasExportSkipReason = 'SIN_DATOS_PERSONALES';

export type CesantiasExportSkippedEmployee = {
  employeeId: string;
  reason: CesantiasExportSkipReason;
};

/**
 * OS-588 (fase 3) — resultado de generar un archivo de consignación (FNA o fondos
 * privados). `skipped` son liquidaciones exportables que se excluyeron del archivo — la
 * exportación completa nunca falla por un registro incompleto (se exportan los válidos),
 * pero la omisión NUNCA es silenciosa: queda en este resultado (ver tests), se persiste
 * en el log de auditoría (`CesantiasExportService`, `AuditAction.EXPORT`) y se resume en
 * la respuesta HTTP vía el header `X-Cesantias-Export-Skipped-Count`
 * (`CesantiasController`).
 */
export type CesantiasExportFileResult = {
  buffer: Buffer;
  filename: string;
  rowCount: number;
  skipped: CesantiasExportSkippedEmployee[];
};
