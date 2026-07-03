import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { LoginPageView } from '@/features/auth/components/LoginPageView';
import { getLoginErrorMessage, isValidLoginInput, useLogin } from '@/features/auth/hooks/useLogin';
import { getDefaultRouteForRole, canAccessPath } from '@/config/rbac.config';
import { getRoleCodeFromToken, isAuthenticated } from '@/lib/auth-token';

/** Matches apps/api/prisma/seed.ts (global User — MES owner). */
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? 'mes-owner@palos-de-lena.dev';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'TestPass123!';

type LoginLocationState = {
  from?: string;
  sessionExpired?: boolean;
};

function getRedirectPath(state: unknown): string {
  const from = (state as LoginLocationState | null)?.from;
  const roleCode = getRoleCodeFromToken();
  if (typeof from === 'string' && from.startsWith('/') && from !== '/login') {
    if (roleCode && canAccessPath(roleCode, from)) {
      return from;
    }
  }
  return getDefaultRouteForRole(roleCode);
}

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(() => {
    const state = location.state as LoginLocationState | null;
    return state?.sessionExpired ? 'Tu sesión expiró. Inicia sesión de nuevo.' : null;
  });
  const hasToken = isAuthenticated();

  const login = useLogin({
    onSuccess: () => {
      navigate(getRedirectPath(location.state), { replace: true });
    },
  });

  if (hasToken) {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }

  const handleSubmit = (): void => {
    setError(null);
    if (!isValidLoginInput(email, password)) {
      setError('Ingresa un correo válido y tu contraseña.');
      return;
    }
    login.mutate(
      { email, password },
      {
        onError: (err) => {
          setError(getLoginErrorMessage(err));
        },
      },
    );
  };

  return (
    <LoginPageView
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={login.isPending}
      error={error}
      demoEmail={DEMO_EMAIL}
      demoPassword={DEMO_PASSWORD}
      onUseDemo={() => {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
        setError(null);
      }}
    />
  );
}
