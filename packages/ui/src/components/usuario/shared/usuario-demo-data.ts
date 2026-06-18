import type { UsuarioTableRowProps } from '../usuario-table-row/UsuarioTableRow';

export const defaultUsuarioDemoRows: UsuarioTableRowProps[] = [
  {
    id: 'user-owner',
    email: 'mes-owner@palos-de-lena.dev',
    cedula: '12345678',
    documentType: 'CC',
    roleName: 'Propietario',
    roleCode: 'OWNER',
    isActive: true,
    lastLoginAt: '2026-06-15T10:30:00.000Z',
  },
  {
    id: 'user-operator',
    email: 'mes-operator@palos-de-lena.dev',
    cedula: '87654321',
    documentType: 'CC',
    roleName: 'Operador',
    roleCode: 'OPERATOR',
    isActive: true,
    lastLoginAt: '2026-06-14T08:15:00.000Z',
  },
  {
    id: 'user-supervisor',
    email: 'supervisor@palos-de-lena.dev',
    cedula: '1020304050',
    documentType: 'CC',
    roleName: 'Supervisor',
    roleCode: 'SUPERVISOR',
    isActive: true,
    lastLoginAt: '2026-06-10T16:45:00.000Z',
  },
  {
    id: 'user-manager',
    email: 'manager@palos-de-lena.dev',
    cedula: '5566778899',
    documentType: 'CE',
    roleName: 'Manager',
    roleCode: 'MANAGER',
    isActive: false,
    lastLoginAt: null,
  },
];
