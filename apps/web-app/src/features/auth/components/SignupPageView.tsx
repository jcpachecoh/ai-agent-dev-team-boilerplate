import { WEB_LOGIN_HERO_IMAGE, WebSignupPage } from '@restopsiq/ui';

import type { SignupDocumentType } from '../types';

export interface SignupPageViewProps {
  email: string;
  cedula: string;
  documentType: SignupDocumentType;
  password: string;
  onEmailChange: (value: string) => void;
  onCedulaChange: (value: string) => void;
  onDocumentTypeChange: (value: SignupDocumentType) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  heroImageUrl?: string;
}

export function SignupPageView({
  email,
  cedula,
  documentType,
  password,
  onEmailChange,
  onCedulaChange,
  onDocumentTypeChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  heroImageUrl = import.meta.env.VITE_LOGIN_HERO_IMAGE ?? WEB_LOGIN_HERO_IMAGE,
}: SignupPageViewProps): React.JSX.Element {
  return (
    <WebSignupPage
      heroImageUrl={heroImageUrl}
      email={email}
      cedula={cedula}
      documentType={documentType}
      password={password}
      onEmailChange={onEmailChange}
      onCedulaChange={onCedulaChange}
      onDocumentTypeChange={onDocumentTypeChange}
      onPasswordChange={onPasswordChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
      footerHref="/login"
      footerLabel="¿Ya tienes cuenta? Inicia sesión"
    />
  );
}
