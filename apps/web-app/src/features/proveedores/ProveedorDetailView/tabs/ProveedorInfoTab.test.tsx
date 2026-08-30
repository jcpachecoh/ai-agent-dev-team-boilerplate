import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProveedorInfoTab from './ProveedorInfoTab';
import type { SupplierViewModel } from '../../types';

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => ({ data: { roleCode: 'OWNER' } }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: () => ({ data: [], isPending: false }),
  };
});

const supplier: SupplierViewModel = {
  id: 'sup-1',
  displayCode: '#SUP001',
  razonSocial: 'Proveedor Test',
  nit: '900111222',
  tipo: 'PERSONA_JURIDICA',
  condicionPago: 'DIAS_30',
  cupoCredito: 0,
  calificacion: 3,
  isActive: true,
  status: 'active',
  categoryLabel: 'Sin categoría',
  leadTimeLabel: '3 días',
  balanceCxp: 0,
  logistics: {
    id: 'log-1',
    deliveryMode: 'SUPPLIER_DELIVERS',
    deliveryPlace: 'PLANT',
    deliveryDays: [1, 3],
    leadTimeDays: 3,
    receptionResponsibleStale: false,
    requiresColdChain: false,
    coverageLocations: [{ id: 'loc-1', name: 'Sede Centro' }],
    status: 'COMPLETE',
    receptionResponsible: { id: 'user-1', email: 'recepcion@test.com' },
  },
};

describe('ProveedorInfoTab', () => {
  it('renders logistics data in read mode', () => {
    render(<ProveedorInfoTab supplier={supplier} />);

    expect(screen.getByText('Información logística')).toBeInTheDocument();
    expect(screen.getByText('Entrega proveedor')).toBeInTheDocument();
    expect(screen.getByText('Sede Centro')).toBeInTheDocument();
  });
});
