import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthApiError, resetPasswordWithToken } from '@/features/auth/api/auth.api';
import { ActivateAccountPageView } from '@/features/auth/components/ActivateAccountPageView';

function isValidPassword(password: string): boolean {
  return password.trim().length >= 8;
}

export default function ActivateAccountPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activateMutation = useMutation({
    mutationFn: () => resetPasswordWithToken(token, password),
    onSuccess: () => {
      setSuccess('Contraseña configurada correctamente. Ya puedes iniciar sesión.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    },
    onError: (err: unknown) => {
      if (err instanceof AuthApiError) {
        setError(err.message);
        return;
      }
      setError('No pudimos configurar la contraseña. Intente nuevamente.');
    },
  });

  const handleSubmit = (): void => {
    setError(null);
    if (!token) {
      setError('El enlace de confirmación no es válido.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    activateMutation.mutate();
  };

  return (
    <ActivateAccountPageView
      password={password}
      confirmPassword={confirmPassword}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
      isSubmitting={activateMutation.isPending}
      error={error}
      success={success}
      missingToken={!token}
    />
  );
}
