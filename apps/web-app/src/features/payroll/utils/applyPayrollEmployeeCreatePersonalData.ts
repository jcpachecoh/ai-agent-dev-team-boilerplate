import { updateEmployeePersonalData } from '../api/personal-data.client';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { buildNombres, mapDocumentTypeToPersonalData } from './employee-name';

export async function applyPayrollEmployeeCreatePersonalData(
  userId: string,
  values: Pick<
    PayrollEmployeeFormValues,
    | 'primerNombre'
    | 'segundoNombre'
    | 'primerApellido'
    | 'segundoApellido'
    | 'documentType'
    | 'cedula'
    | 'email'
    | 'departamento'
    | 'ciudad'
    | 'barrio'
    | 'localidad'
  >,
): Promise<void> {
  await updateEmployeePersonalData(userId, {
    nombres: buildNombres(values),
    primerApellido: values.primerApellido.trim(),
    segundoApellido: values.segundoApellido.trim() || undefined,
    tipoDocumento: mapDocumentTypeToPersonalData(values.documentType),
    numeroDocumento: values.cedula.trim(),
    correo: values.email.trim(),
    departamento: values.departamento.trim() || undefined,
    ciudad: values.ciudad.trim() || undefined,
    barrio: values.barrio.trim() || undefined,
    localidad: values.localidad.trim() || undefined,
  });
}
