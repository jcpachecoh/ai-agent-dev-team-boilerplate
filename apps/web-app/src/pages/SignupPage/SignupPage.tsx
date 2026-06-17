import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { SignupPageView } from '@/features/auth/components/SignupPageView';
import {
  getSignupErrorMessage,
  isValidSignupInput,
  useSignup,
} from '@/features/auth/hooks/useSignup';
import { isAuthenticated } from '@/lib/auth-token';
import type { SignupDocumentType } from '@/features/auth/types';

type SignupLocationState = {
  from?: string;
};

function getRedirectPath(state: unknown): string {
  const from = (state as SignupLocationState | null)?.from;
  if (typeof from === 'string' && from.startsWith('/') && from !== '/signup') {
    return from;
  }
  return '/';
}

export default function SignupPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [documentType, setDocumentType] = useState<SignupDocumentType>('CC');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasToken = isAuthenticated();

  const signup = useSignup({
    onSuccess: () => {
      navigate(getRedirectPath(location.state), { replace: true });
    },
  });

  if (hasToken) {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }

  const handleSubmit = (): void => {
    setError(null);
    if (!isValidSignupInput(email, cedula, password)) {
      setError('Ingresa un correo válido, documento y una contraseña de al menos 8 caracteres.');
      return;
    }
    signup.mutate(
      {
        email: email.trim(),
        cedula: cedula.trim(),
        documentType,
        password,
      },
      {
        onError: (err) => {
          setError(getSignupErrorMessage(err));
        },
      },
    );
  };

  return (
    <SignupPageView
      email={email}
      cedula={cedula}
      documentType={documentType}
      password={password}
      onEmailChange={setEmail}
      onCedulaChange={setCedula}
      onDocumentTypeChange={setDocumentType}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isSubmitting={signup.isPending}
      error={error}
    />
  );
}
