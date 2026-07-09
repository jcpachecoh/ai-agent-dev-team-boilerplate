import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { PayrollEmployeeAssetsTab } from './PayrollEmployeeAssetsTab';

vi.mock('../hooks/usePayrollEmployeeQuery', () => ({
  usePayrollEmployeeQuery: vi.fn(),
}));

vi.mock('../hooks/useEmployeeAssetsQuery', () => ({
  useEmployeeAssetsQuery: vi.fn(),
}));

vi.mock('../hooks/useEmployeeAssetsMutations', () => ({
  useEmployeeAssetsMutations: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(),
}));

vi.mock('@/lib/auth-token', () => ({
  getRoleCodeFromToken: vi.fn(() => 'ADMIN'),
}));

vi.mock('@/config/rbac.config', () => ({
  canWritePayrollEmployee: vi.fn(() => false),
}));

vi.mock('./PayrollEmployeeProfileTabLoading', () => ({
  PayrollEmployeeProfileTabLoading: () => <div data-testid="tab-loading" />,
}));

vi.mock('./EmployeeAssetFormModal', () => ({
  EmployeeAssetFormModal: () => null,
}));

vi.mock('../api/employee-assets.upload', () => ({
  fetchEmployeeAssetDownloadUrl: vi.fn(),
}));

import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import { useEmployeeAssetsQuery } from '../hooks/useEmployeeAssetsQuery';
import { useEmployeeAssetsMutations } from '../hooks/useEmployeeAssetsMutations';
import { useMe } from '@/features/auth/hooks/useMe';
import { canWritePayrollEmployee } from '@/config/rbac.config';
import type { EmployeeAsset } from '../types/employee-asset.types';

const EMPLOYEE_STUB = {
  id: 'emp-001',
  name: 'Pedro Mora',
  position: 'Mesero',
  area: 'Servicio',
  userId: 'user-001',
};

function makeAsset(overrides: Partial<EmployeeAsset> = {}): EmployeeAsset {
  return {
    id: 'asset-001',
    tenantId: 'tenant-001',
    employeeId: 'emp-001',
    assetName: 'Laptop Dell',
    type: 'EDUCATIONAL',
    assignmentDate: '2026-01-15T00:00:00.000Z',
    value: 3500000,
    status: 'ACTIVO',
    notes: null,
    storageObjectId: null,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

const mockedEmployeeQuery = vi.mocked(usePayrollEmployeeQuery);
const mockedAssetsQuery = vi.mocked(useEmployeeAssetsQuery);
const mockedMutations = vi.mocked(useEmployeeAssetsMutations);
const mockedUseMe = vi.mocked(useMe);
const mockedCanWrite = vi.mocked(canWritePayrollEmployee);

function setupQueries(
  options: {
    employeeLoading?: boolean;
    assetsLoading?: boolean;
    assetsError?: boolean;
    assets?: EmployeeAsset[];
    canWrite?: boolean;
  } = {},
) {
  const {
    employeeLoading = false,
    assetsLoading = false,
    assetsError = false,
    assets = [],
    canWrite = false,
  } = options;

  mockedUseMe.mockReturnValue({ data: { roleCode: 'ADMIN' } } as ReturnType<typeof useMe>);
  mockedCanWrite.mockReturnValue(canWrite);

  mockedEmployeeQuery.mockReturnValue({
    data: employeeLoading ? undefined : EMPLOYEE_STUB,
    isLoading: employeeLoading,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof usePayrollEmployeeQuery>);

  mockedAssetsQuery.mockReturnValue({
    data: assetsLoading ? undefined : assets,
    isLoading: assetsLoading,
    isError: assetsError,
    refetch: vi.fn(),
  } as ReturnType<typeof useEmployeeAssetsQuery>);

  mockedMutations.mockReturnValue({
    createMutation: { mutateAsync: vi.fn() } as unknown,
    updateMutation: { mutateAsync: vi.fn() } as unknown,
  } as ReturnType<typeof useEmployeeAssetsMutations>);
}

describe('PayrollEmployeeAssetsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading while employee query is loading', () => {
    setupQueries({ employeeLoading: true });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByTestId('tab-loading')).toBeInTheDocument();
  });

  it('shows loading while assets query is loading', () => {
    setupQueries({ assetsLoading: true });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByTestId('tab-loading')).toBeInTheDocument();
  });

  it('shows error state when assets query fails', () => {
    setupQueries({ assetsError: true });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('No se pudieron cargar los activos.')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('shows empty state when no assets exist', () => {
    setupQueries({ assets: [] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Sin activos asignados')).toBeInTheDocument();
  });

  it('renders asset row with name, category, value, date, and status', () => {
    setupQueries({ assets: [makeAsset()] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);

    expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    expect(screen.getByText('Educativo')).toBeInTheDocument();
    expect(screen.getByText('$ 3.500.000')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows download button when asset has storageObjectId', () => {
    setupQueries({ assets: [makeAsset({ storageObjectId: 'obj-001' })] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByLabelText('Descargar archivo de Laptop Dell')).toBeInTheDocument();
  });

  it('does not show download button when storageObjectId is null', () => {
    setupQueries({ assets: [makeAsset({ storageObjectId: null })] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.queryByLabelText('Descargar archivo de Laptop Dell')).not.toBeInTheDocument();
  });

  it('shows status select when user can write', () => {
    setupQueries({ assets: [makeAsset()], canWrite: true });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByLabelText('Cambiar estado de Laptop Dell')).toBeInTheDocument();
  });

  it('hides status select when user cannot write', () => {
    setupQueries({ assets: [makeAsset()], canWrite: false });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.queryByLabelText('Cambiar estado de Laptop Dell')).not.toBeInTheDocument();
  });

  it('shows add button when user can write', () => {
    setupQueries({ canWrite: true });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('+ Agregar activo')).toBeInTheDocument();
  });

  it('hides add button when user cannot write', () => {
    setupQueries({ canWrite: false });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.queryByText('+ Agregar activo')).not.toBeInTheDocument();
  });

  it('renders asset count badge when assets exist', () => {
    setupQueries({
      assets: [makeAsset(), makeAsset({ id: 'asset-002', assetName: 'Silla ergonómica' })],
    });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows notes when asset has notes', () => {
    setupQueries({ assets: [makeAsset({ notes: 'Entregado con cargador' })] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Entregado con cargador')).toBeInTheDocument();
  });

  it('renders RETORNADO status correctly', () => {
    setupQueries({ assets: [makeAsset({ status: 'RETORNADO' })] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Retornado')).toBeInTheDocument();
  });

  it('renders DADO_DE_BAJA status correctly', () => {
    setupQueries({ assets: [makeAsset({ status: 'DADO_DE_BAJA' })] });
    render(<PayrollEmployeeAssetsTab userId="user-001" theme="dark" />);
    expect(screen.getByText('Dado de baja')).toBeInTheDocument();
  });
});
