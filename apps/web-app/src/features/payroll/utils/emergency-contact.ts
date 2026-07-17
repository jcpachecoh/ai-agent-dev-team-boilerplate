/**
 * Contacto de emergencia del empleado (OS-563 follow-up).
 * Reutiliza los campos de `employee_personal_data` (no hay modelo EmergencyContact separado).
 */

export interface EmergencyContactFields {
  contactoEmergenciaNombre: string;
  contactoEmergenciaParentesco: string;
  contactoEmergenciaTelefono: string;
}

export const EMPTY_EMERGENCY_CONTACT: EmergencyContactFields = {
  contactoEmergenciaNombre: '',
  contactoEmergenciaParentesco: '',
  contactoEmergenciaTelefono: '',
};

/** True cuando los tres campos están presentes y el teléfono tiene formato válido. */
export function hasCompleteEmergencyContact(
  values: Partial<EmergencyContactFields> | null | undefined,
): boolean {
  if (!values) return false;
  const name = values.contactoEmergenciaNombre?.trim() ?? '';
  const relationship = values.contactoEmergenciaParentesco?.trim() ?? '';
  const phone = values.contactoEmergenciaTelefono?.trim() ?? '';
  return Boolean(name && relationship && /^\d{7,15}$/.test(phone));
}

export function validateEmergencyContact(
  values: Partial<EmergencyContactFields>,
  options: { required: boolean } = { required: true },
): Partial<Record<keyof EmergencyContactFields, string>> {
  const errors: Partial<Record<keyof EmergencyContactFields, string>> = {};
  const name = values.contactoEmergenciaNombre?.trim() ?? '';
  const relationship = values.contactoEmergenciaParentesco?.trim() ?? '';
  const phone = values.contactoEmergenciaTelefono?.trim() ?? '';

  const anyFilled = Boolean(name || relationship || phone);
  if (!options.required && !anyFilled) {
    return errors;
  }

  if (!name) {
    errors.contactoEmergenciaNombre = 'El nombre del contacto de emergencia es obligatorio';
  }
  if (!relationship) {
    errors.contactoEmergenciaParentesco = 'El parentesco es obligatorio';
  }
  if (!phone) {
    errors.contactoEmergenciaTelefono = 'El teléfono del contacto de emergencia es obligatorio';
  } else if (!/^\d{7,15}$/.test(phone)) {
    errors.contactoEmergenciaTelefono = 'Entre 7 y 15 dígitos';
  }

  return errors;
}

export const EMERGENCY_CONTACT_PENDING_MESSAGE =
  'Contacto de emergencia pendiente de completar. Los empleados creados antes de este requisito no quedan bloqueados, pero RRHH debe completar nombre, parentesco y teléfono.';
