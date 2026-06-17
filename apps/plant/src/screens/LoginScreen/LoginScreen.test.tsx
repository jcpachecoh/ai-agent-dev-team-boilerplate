import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authService from '@/services/auth.service';
import * as stationService from '@/services/station.service';
import { useSessionStore } from '@/stores/session.store';
import { LoginScreen } from './LoginScreen';

// lucide-react v0.511 targets React 19 — stub UI components to avoid incompatibility in jsdom/React 18
vi.mock('@restopsiq/ui', () => ({
  PinKeypad: ({
    onKeyPress,
    onConfirm,
  }: {
    onKeyPress?: (key: string) => void;
    onConfirm?: () => void;
  }) => (
    <div role="group" aria-label="Teclado PIN">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
        <button key={d} onClick={() => onKeyPress?.(d)} aria-label={`Tecla ${d}`}>
          {d}
        </button>
      ))}
      <button onClick={() => onKeyPress?.('backspace')} aria-label="Tecla borrar">
        ←
      </button>
      <button onClick={onConfirm} aria-label="OK">
        OK
      </button>
    </div>
  ),
  FieldAlertBanner: ({ children }: { children: React.ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />,
  ),
  Button: ({
    children,
    loading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button {...props}>{loading ? 'Guardando…' : children}</button>
  ),
}));

vi.mock('@/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/auth.service')>();
  return {
    ...actual,
    loginOperator: vi.fn(),
    shouldShowDemoPinHint: vi.fn(() => true),
    getDemoPinHint: vi.fn(() => '1234'),
  };
});

vi.mock('@/services/station.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/station.service')>();
  return {
    ...actual,
    setStationId: vi.fn().mockResolvedValue(undefined),
  };
});

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderLoginScreen(ui: React.ReactElement): QueryClient {
  const queryClient = createTestQueryClient();
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return queryClient;
}

async function enterCedula(user: ReturnType<typeof userEvent.setup>, cedula = '12345678') {
  for (const digit of cedula) {
    await user.click(screen.getByRole('button', { name: `Tecla ${digit}` }));
  }
  await user.click(screen.getByRole('button', { name: 'OK' }));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      stationId: 'EST-02',
      operator: null,
      isAuthenticated: false,
      sessionStartedAt: null,
    });
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(() => true),
      configurable: true,
      writable: true,
    });
  });

  it('renders station badge, area title, four pin dots and keypad', () => {
    renderLoginScreen(<LoginScreen areaName="Corte y deshuese" />);

    expect(screen.getByText('EST-02')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /corte y deshuese/i })).toBeInTheDocument();
    expect(screen.getByText(/ingrese su número de cédula/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /teclado pin/i })).toBeInTheDocument();
  });

  it('does not submit when cédula is shorter than 8 digits', async () => {
    const user = userEvent.setup();
    renderLoginScreen(<LoginScreen />);

    for (const digit of '123456') {
      await user.click(screen.getByRole('button', { name: `Tecla ${digit}` }));
    }
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(
      await screen.findByText('Ingrese un número de cédula válido (mín. 8 dígitos)'),
    ).toBeInTheDocument();
    expect(authService.loginOperator).not.toHaveBeenCalled();
    expect(screen.getByText(/ingrese su número de cédula/i)).toBeInTheDocument();
  });

  it('does not submit when PIN is incomplete', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.loginOperator).mockResolvedValue({
      accessToken: 'access-token',
      operator: {
        id: 'op1',
        name: 'Ana',
        role: 'OPERATOR',
        tenantId: 'tenant-abc',
        locationId: 'EST-02',
      },
      locations: [{ id: 'EST-02', name: 'Sede Test', code: 'EST-02', city: null }],
      requiresLocationSelection: false,
    });

    renderLoginScreen(<LoginScreen />);
    await enterCedula(user);
    await user.click(screen.getByRole('button', { name: 'Tecla 1' }));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(authService.loginOperator).not.toHaveBeenCalled();
  });

  it('shows generic error and vibrates on wrong PIN', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.loginOperator).mockRejectedValue(
      new authService.OperatorAuthError('Cédula o PIN incorrecto.', 401),
    );

    renderLoginScreen(<LoginScreen />);
    await enterCedula(user);

    for (const digit of ['9', '9', '9', '9']) {
      await user.click(screen.getByRole('button', { name: `Tecla ${digit}` }));
    }
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(await screen.findByText('Cédula o PIN incorrecto.')).toBeInTheDocument();
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it('shows loading feedback while login mutation is pending', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.loginOperator).mockImplementation(
      () => new Promise<Awaited<ReturnType<typeof authService.loginOperator>>>(() => undefined),
    );

    renderLoginScreen(<LoginScreen />);
    await enterCedula(user);

    for (const digit of ['1', '2', '3', '4']) {
      await user.click(screen.getByRole('button', { name: `Tecla ${digit}` }));
    }
    await waitFor(() => {
      expect(
        screen
          .getByRole('group', { name: /dígitos ingresados/i })
          .querySelectorAll('span[class*="dotFilled"]'),
      ).toHaveLength(4);
    });
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(authService.loginOperator).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent('Validando credenciales…');
  });

  it('calls session login and success callback on valid PIN', async () => {
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    vi.mocked(authService.loginOperator).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      operator: {
        id: 'op1',
        name: 'Carlos Mendoza',
        role: 'OPERATOR',
        tenantId: 'tenant-abc',
        locationId: 'EST-02',
      },
      locations: [{ id: 'EST-02', name: 'Sede Test', code: 'EST-02', city: null }],
      requiresLocationSelection: false,
    });

    const queryClient = renderLoginScreen(<LoginScreen onLoginSuccess={onLoginSuccess} />);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    await enterCedula(user);

    for (const digit of ['1', '2', '3', '4']) {
      await user.click(screen.getByRole('button', { name: `Tecla ${digit}` }));
    }
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(authService.loginOperator).toHaveBeenCalledWith(
      {
        stationId: 'EST-02',
        cedula: '12345678',
        pin: '1234',
      },
      expect.any(Object),
    );
    await waitFor(() => expect(useSessionStore.getState().isAuthenticated).toBe(true));
    expect(useSessionStore.getState().operator?.operatorName).toBe('Carlos Mendoza');
    expect(useSessionStore.getState().operator?.accessToken).toBe('access-token');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mes-auth', 'me'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plant-session'] });

    await waitFor(
      () => {
        expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
      },
      { timeout: 500 },
    );

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled(), { timeout: 2500 });
  });

  it('prompts for station setup when stationId is missing', () => {
    useSessionStore.setState({ stationId: null });
    renderLoginScreen(<LoginScreen />);
    expect(screen.getByText(/configurar estación/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/est-01/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid station ID', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ stationId: null });
    renderLoginScreen(<LoginScreen />);

    await user.type(screen.getByPlaceholderText(/est-01/i), 'X');
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(stationService.setStationId).not.toHaveBeenCalled();
  });

  it('saves and applies a valid station ID on submit', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ stationId: null });
    renderLoginScreen(<LoginScreen />);

    await user.type(screen.getByPlaceholderText(/est-01/i), 'EST-05');
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(stationService.setStationId).toHaveBeenCalledWith('EST-05');
    });
    expect(useSessionStore.getState().stationId).toBe('EST-05');
  });
});
