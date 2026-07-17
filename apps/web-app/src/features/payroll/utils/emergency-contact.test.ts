import { describe, expect, it } from 'vitest';

import { validateBeneficiaryForm } from './beneficiary';
import {
  EMERGENCY_CONTACT_PENDING_MESSAGE,
  hasCompleteEmergencyContact,
  validateEmergencyContact,
} from './emergency-contact';
import type { BeneficiaryFormRow } from '../types/payroll.types';

describe('validateBeneficiaryForm', () => {
  const base: BeneficiaryFormRow = {
    documentType: 'CC',
    documentNumber: '123',
    relationshipType: 'CHILD',
    primerNombre: 'ANA',
    segundoNombre: '',
    primerApellido: 'GARCIA',
    segundoApellido: '',
    fechaNacimiento: '2015-06-01',
    disability: 'NOT_APPLICABLE',
  };

  it('acepta beneficiario sin segundo nombre ni segundo apellido', () => {
    expect(validateBeneficiaryForm(base)).toEqual({});
  });

  it('exige primer nombre, primer apellido y fecha de nacimiento', () => {
    expect(validateBeneficiaryForm({ ...base, primerNombre: '' }).primerNombre).toBeTruthy();
    expect(validateBeneficiaryForm({ ...base, primerApellido: '' }).primerApellido).toBeTruthy();
    expect(validateBeneficiaryForm({ ...base, fechaNacimiento: '' }).fechaNacimiento).toBeTruthy();
  });

  it('incluye Padres (Padre/Madre) en tipos válidos sin error de relación', () => {
    expect(validateBeneficiaryForm({ ...base, relationshipType: 'FATHER' })).toEqual({});
    expect(validateBeneficiaryForm({ ...base, relationshipType: 'MOTHER' })).toEqual({});
  });
});

describe('emergency contact', () => {
  it('marca incompleto a empleados legacy sin contacto (no bloquea otras operaciones)', () => {
    expect(hasCompleteEmergencyContact(null)).toBe(false);
    expect(
      hasCompleteEmergencyContact({
        contactoEmergenciaNombre: '',
        contactoEmergenciaParentesco: '',
        contactoEmergenciaTelefono: '',
      }),
    ).toBe(false);
    expect(EMERGENCY_CONTACT_PENDING_MESSAGE).toContain('pendiente de completar');
  });

  it('exige nombre, parentesco y teléfono al crear/guardar', () => {
    const errors = validateEmergencyContact(
      {
        contactoEmergenciaNombre: '',
        contactoEmergenciaParentesco: '',
        contactoEmergenciaTelefono: '',
      },
      { required: true },
    );
    expect(errors.contactoEmergenciaNombre).toBeTruthy();
    expect(errors.contactoEmergenciaParentesco).toBeTruthy();
    expect(errors.contactoEmergenciaTelefono).toBeTruthy();
  });

  it('acepta un contacto completo', () => {
    expect(
      validateEmergencyContact(
        {
          contactoEmergenciaNombre: 'MARIA LOPEZ',
          contactoEmergenciaParentesco: 'Madre',
          contactoEmergenciaTelefono: '3001234567',
        },
        { required: true },
      ),
    ).toEqual({});
    expect(
      hasCompleteEmergencyContact({
        contactoEmergenciaNombre: 'MARIA LOPEZ',
        contactoEmergenciaParentesco: 'Madre',
        contactoEmergenciaTelefono: '3001234567',
      }),
    ).toBe(true);
  });
});
