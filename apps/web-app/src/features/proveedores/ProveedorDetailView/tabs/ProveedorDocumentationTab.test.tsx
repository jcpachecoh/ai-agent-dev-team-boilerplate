import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import ProveedorDocumentationTab from './ProveedorDocumentationTab';

const { canWriteSupplierDocumentsMock } = vi.hoisted(() => ({
  canWriteSupplierDocumentsMock: vi.fn(() => true),
}));

const mockDocuments = {
  completeness: { loaded: 1, total: 2, requiredPending: ['RUT'] },
  documents: [
    {
      documentType: 'RUT',
      label: 'RUT actualizado',
      requirement: 'REQUIRED',
      status: 'PENDING',
      issuedAt: null,
      expiresAt: null,
      lastUploadedAt: null,
      uploadedByUserId: null,
      needsReview: false,
      alertLevel: 'NONE',
      currentVersion: null,
      previousVersion: null,
    },
    {
      documentType: 'CERTIFICACION_BANCARIA',
      label: 'Certificación bancaria',
      requirement: 'REQUIRED',
      status: 'UPLOADED',
      issuedAt: null,
      expiresAt: null,
      lastUploadedAt: '2026-01-10T00:00:00.000Z',
      uploadedByUserId: 'user-1',
      needsReview: false,
      alertLevel: 'NONE',
      currentVersion: {
        id: 'ver-1',
        storageObjectId: 'st-1',
        versionNumber: 1,
        mimeType: 'application/pdf',
        size: 1000,
        originalName: 'cert.pdf',
      },
      previousVersion: null,
    },
  ],
};

vi.mock('@/config/rbac.config', () => ({
  canWriteSupplierDocuments: canWriteSupplierDocumentsMock,
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => ({ data: { roleCode: 'MANAGER' } }),
}));

vi.mock('@/lib/auth-token', () => ({
  getRoleCodeFromToken: () => 'MANAGER',
}));

vi.mock('../../hooks/useSupplierDocuments', () => ({
  useSupplierDocuments: vi.fn(),
  useUploadSupplierDocument: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useDeleteSupplierDocument: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

import { useSupplierDocuments } from '../../hooks/useSupplierDocuments';

describe('ProveedorDocumentationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWriteSupplierDocumentsMock.mockReturnValue(true);
    vi.mocked(useSupplierDocuments).mockReturnValue({
      data: mockDocuments,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('renders documentation table and completeness bar', () => {
    render(
      <TestQueryProvider>
        <ProveedorDocumentationTab supplierId="sup-1" />
      </TestQueryProvider>,
    );

    expect(screen.getByText('1 de 2 documentos cargados')).toBeInTheDocument();
    expect(screen.getByText('RUT actualizado')).toBeInTheDocument();
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
  });

  it('hides upload actions without write permission', () => {
    canWriteSupplierDocumentsMock.mockReturnValue(false);

    render(
      <TestQueryProvider>
        <ProveedorDocumentationTab supplierId="sup-1" />
      </TestQueryProvider>,
    );

    expect(screen.queryByRole('button', { name: /subir documento/i })).not.toBeInTheDocument();
  });
});
