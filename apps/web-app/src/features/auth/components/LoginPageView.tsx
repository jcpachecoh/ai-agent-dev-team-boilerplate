import { WEB_LOGIN_HERO_IMAGE, WebLoginPage } from '@restopsiq/ui';

export interface LoginPageViewProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoEmail: string;
  demoPassword: string;
  onUseDemo?: () => void;
  heroImageUrl?: string;
}

export function LoginPageView({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  demoEmail,
  demoPassword,
  onUseDemo,
  heroImageUrl = import.meta.env.VITE_LOGIN_HERO_IMAGE ?? WEB_LOGIN_HERO_IMAGE,
}: LoginPageViewProps): React.JSX.Element {
  return (
    <WebLoginPage
      heroImageUrl={heroImageUrl}
      email={email}
      password={password}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
      demoCredentials={{ email: demoEmail, password: demoPassword }}
      onUseDemo={
        onUseDemo ??
        (() => {
          onEmailChange(demoEmail);
          onPasswordChange(demoPassword);
        })
      }
    />
  );
}
