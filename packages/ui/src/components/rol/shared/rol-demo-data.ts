import type { RolTableRowData } from './rol-types';

export const defaultRolDemoRows: RolTableRowData[] = [
  {
    id: 'rol-owner',
    code: 'OWNER',
    name: 'Propietario',
    userCount: 2,
    permissionCount: 48,
    isActive: true,
  },
  {
    id: 'rol-supervisor',
    code: 'SUPERVISOR',
    name: 'Supervisor',
    userCount: 3,
    permissionCount: 32,
    isActive: true,
  },
  {
    id: 'rol-nomina',
    code: 'NOMINA',
    name: 'Nómina',
    userCount: 1,
    permissionCount: 8,
    isActive: true,
  },
  {
    id: 'rol-operator',
    code: 'OPERATOR',
    name: 'Operador',
    userCount: 5,
    permissionCount: 12,
    isActive: false,
  },
];
