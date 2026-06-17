import type { SedeAssignedUser, SedeListPreviewRow } from '@restopsiq/ui';

export interface MockSedeLocation extends SedeListPreviewRow {
  latitude?: number | null;
  longitude?: number | null;
}

export const MOCK_SEDES: MockSedeLocation[] = [
  {
    id: 'sed-08',
    name: 'Sede Bocagrande',
    createdAt: '2024-04-12',
    address: 'Av. San Martín # 6-40',
    city: 'Cartagena',
    phone: '+57 605 901 2345',
    isActive: true,
    assignedUsers: [
      {
        id: 'u1',
        name: 'Ana López',
        email: 'a.lopez@palosdelena.com',
        roleLabel: 'Operadora',
        initials: 'AL',
        tone: 'teal',
      },
      {
        id: 'u2',
        name: 'Roberto Silva',
        email: 'r.silva@palosdelena.com',
        roleLabel: 'Operador',
        initials: 'RS',
        tone: 'coral',
      },
    ],
  },
  {
    id: 'sed-09',
    name: 'Sede Bucarica',
    createdAt: '2024-06-03',
    address: 'Calle 45 # 25-10',
    city: 'Cartagena',
    phone: '+57 605 555 1234',
    isActive: true,
    assignedUsers: [],
  },
  {
    id: 'sed-10',
    name: 'Sede Centro',
    createdAt: '2024-01-15',
    address: 'Cra 7 # 32-16',
    city: 'Bogotá',
    phone: '+57 601 234 5678',
    isActive: false,
    assignedUsers: [],
  },
  {
    id: 'sed-11',
    name: 'Sede Chapinero',
    createdAt: '2024-03-20',
    address: 'Cra 13 # 63-40',
    city: 'Bogotá',
    phone: '+57 601 987 6543',
    isActive: true,
    assignedUsers: [
      {
        id: 'u3',
        name: 'Carlos Ruiz',
        email: 'c.ruiz@palosdelena.com',
        roleLabel: 'Supervisor',
        initials: 'CR',
        tone: 'indigo',
      },
    ],
  },
];

export function getMockAssignedUsers(locationId: string): SedeAssignedUser[] {
  return MOCK_SEDES.find((sede) => sede.id === locationId)?.assignedUsers ?? [];
}
