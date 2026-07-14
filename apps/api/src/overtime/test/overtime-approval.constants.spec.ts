import { OvertimeApprovalLevel, OvertimeStatus } from '@prisma/client';

import {
  resolveActiveApprovalLevel,
  resolveApproverPositionIds,
} from '../overtime-approval.constants';

describe('overtime-approval.constants', () => {
  it('resolveActiveApprovalLevel mapea estados pendientes', () => {
    expect(resolveActiveApprovalLevel(OvertimeStatus.PENDIENTE_ADMIN)).toBe(
      OvertimeApprovalLevel.ADMINISTRADOR,
    );
    expect(resolveActiveApprovalLevel(OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES)).toBe(
      OvertimeApprovalLevel.GERENCIA_OPERACIONES,
    );
    expect(resolveActiveApprovalLevel(OvertimeStatus.PENDIENTE_GERENCIA_GENERAL)).toBe(
      OvertimeApprovalLevel.GERENCIA_GENERAL,
    );
    expect(resolveActiveApprovalLevel(OvertimeStatus.APROBADA)).toBeNull();
    expect(resolveActiveApprovalLevel(OvertimeStatus.OBJETADA)).toBeNull();
  });

  it('resolveApproverPositionIds retorna cargos D4', () => {
    expect(resolveApproverPositionIds(OvertimeApprovalLevel.ADMINISTRADOR)).toContain(
      'pos-pdl-001',
    );
    expect(resolveApproverPositionIds(OvertimeApprovalLevel.GERENCIA_GENERAL)).toContain(
      'pos-pdl-007',
    );
  });
});
