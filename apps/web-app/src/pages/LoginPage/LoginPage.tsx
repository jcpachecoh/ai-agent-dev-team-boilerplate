import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { LoginPageView } from '@/features/auth/components/LoginPageView';
import { getLoginErrorMessage, isValidLoginInput, useLogin } from '@/features/auth/hooks/useLogin';
import { isAuthenticated } from '@/lib/auth-token';

/** Matches apps/api/prisma/seed.ts (owner operational user). */
const DEMO_CEDULA = import.meta.env.VITE_DEMO_CEDULA ?? '12345678';
const DEMO_PIN = import.meta.env.VITE_DEMO_PIN ?? '1234';

type LoginLocationState = {
  from?: string;
};

function getRedirectPath(state: unknown): string {
  const from = (state as LoginLocationState | null)?.from;
  if (typeof from === 'string' && from.startsWith('/') && from !== '/login') {
    return from;
  }
  return '/';
}

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [cedula, setCedula] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    if (!isValidLoginInput(cedula, pin)) {
      setError('La cédula debe tener 8–11 dígitos y el PIN entre 4 y 6.');
      return;
    }
    login.mutate(
      { cedula, pin },
      {
        onError: (err) => {
          setError(getLoginErrorMessage(err));
        },
      },
    );
  };

  return (
    <LoginPageView
      cedula={cedula}
      pin={pin}
      onCedulaChange={setCedula}
      onPinChange={setPin}
      onSubmit={handleSubmit}
      isSubmitting={login.isPending}
      error={error}
      demoCedula={DEMO_CEDULA}
      demoPin={DEMO_PIN}
      onUseDemo={() => {
        setCedula(DEMO_CEDULA);
        setPin(DEMO_PIN);
        setError(null);
      }}
    />
  );
}
