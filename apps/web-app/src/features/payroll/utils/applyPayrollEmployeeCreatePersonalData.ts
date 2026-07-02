import { updateEmployeePersonalData } from '../api/personal-data.client';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { mapDocumentTypeToPersonalData } from './employee-name';

export async function applyPayrollEmployeeCreatePersonalData(
  userId: string,
  values: Pick<
    PayrollEmployeeFormValues,
    | 'nombres'
    | 'primerApellido'
    | 'segundoApellido'
    | 'documentType'
    | 'cedula'
    | 'email'
    | 'barrio'
    | 'localidad'
  >,
): Promise<void> {
  await updateEmployeePersonalData(userId, {
    nombres: values.nombres.trim(),
    primerApellido: values.primerApellido.trim(),
    segundoApellido: values.segundoApellido.trim() || undefined,
    tipoDocumento: mapDocumentTypeToPersonalData(values.documentType),
    numeroDocumento: values.cedula.trim(),
    correo: values.email.trim(),
    barrio: values.barrio.trim() || undefined,
    localidad: values.localidad.trim() || undefined,
  });
}
