import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import ProveedorFormView from './ProveedorFormView';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../hooks/useSupplierMutations', () => ({
  useCreateSupplier: () => ({ mutateAsync: mockCreate, isPending: false }),
  useUpdateSupplier: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useDeleteSupplier: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useSupplier', () => ({
  useSupplier: () => ({ data: null, isPending: false, isError: false }),
}));

function renderCreateForm(): void {
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={['/proveedores/nuevo']}>
        <Routes>
          <Route path="/proveedores/nuevo" element={<ProveedorFormView mode="create" />} />
        </Routes>
      </MemoryRouter>
    </TestQueryProvider>,
  );
}

describe('ProveedorFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables save when required fields are empty', () => {
    renderCreateForm();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });

  it('renders Dirección in Información general section', () => {
    renderCreateForm();
    // Dirección must be present and appear before the Contacto section title
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    const allText = document.body.textContent ?? '';
    const direccionPos = allText.indexOf('Dirección');
    const contactoPos = allText.indexOf('Contacto');
    expect(direccionPos).toBeGreaterThanOrEqual(0);
    expect(contactoPos).toBeGreaterThanOrEqual(0);
    expect(direccionPos).toBeLessThan(contactoPos);
  });

  it('renders Departamento as a select in Información general', () => {
    renderCreateForm();
    expect(screen.getByLabelText(/departamento/i)).toBeInTheDocument();
  });

  it('renders Ciudad as a select in Información general', () => {
    renderCreateForm();
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();
  });

  it('Calificación field does not appear in the form', () => {
    renderCreateForm();
    expect(screen.queryByLabelText(/calificaci[oó]n/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/calificaci[oó]n/i)).not.toBeInTheDocument();
  });

  it('renders Teléfono del contacto in Contacto section', () => {
    renderCreateForm();
    expect(screen.getByLabelText(/teléfono del contacto/i)).toBeInTheDocument();
  });

  it('renders Correo del contacto in Contacto section', () => {
    renderCreateForm();
    expect(screen.getByLabelText(/correo del contacto/i)).toBeInTheDocument();
  });

  it('Teléfono del contacto has type tel', () => {
    renderCreateForm();
    const input = screen.getByLabelText(/teléfono del contacto/i);
    expect(input).toHaveAttribute('type', 'tel');
  });

  it('Correo del contacto has type email', () => {
    renderCreateForm();
    const input = screen.getByLabelText(/correo del contacto/i);
    expect(input).toHaveAttribute('type', 'email');
  });

  it('payload create does not include calificacion', async () => {
    mockCreate.mockResolvedValue({ id: 'new-sup' });
    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/razón social/i), {
      target: { value: 'Proveedor Test' },
    });
    fireEvent.change(screen.getByLabelText(/^nit/i), { target: { value: '900111222' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await vi.waitFor(() => expect(mockCreate).toHaveBeenCalled());

    const calledWith = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(calledWith).not.toHaveProperty('calificacion');
  });

  it('payload create includes departamento', async () => {
    mockCreate.mockResolvedValue({ id: 'new-sup' });
    renderCreateForm();

    fireEvent.change(screen.getByLabelText(/razón social/i), {
      target: { value: 'Proveedor Test' },
    });
    fireEvent.change(screen.getByLabelText(/^nit/i), { target: { value: '900111222' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await vi.waitFor(() => expect(mockCreate).toHaveBeenCalled());

    const calledWith = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(calledWith)).toContain('departamento');
  });
});
