import { updateEmployeePersonalData } from '../api/personal-data.client';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { composeDireccion } from './direccion';
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
    | 'direccionTipoVia'
    | 'direccionNumeroVia'
    | 'direccionPlaca1'
    | 'direccionPlaca2'
    | 'direccionComplemento'
    | 'contactoEmergenciaNombre'
    | 'contactoEmergenciaParentesco'
    | 'contactoEmergenciaTelefono'
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
    direccion: composeDireccion(values) || undefined,
    contactoEmergenciaNombre: values.contactoEmergenciaNombre.trim(),
    contactoEmergenciaParentesco: values.contactoEmergenciaParentesco.trim(),
    contactoEmergenciaTelefono: values.contactoEmergenciaTelefono.trim(),
  });
}
