import { WebLoginPage } from '@restopsiq/ui';

const DEFAULT_BRAND_NAME = 'COMMAND CENTER';
const DEFAULT_BRAND_LOCATION = 'PLATFORM · RESTOPSIQ ENTERPRISE';
const DEFAULT_BRAND_INITIAL = 'R';

export interface LoginPageViewProps {
  cedula: string;
  pin: string;
  onCedulaChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoCedula: string;
  demoPin: string;
  onUseDemo?: () => void;
  brandName?: string;
  brandLocation?: string;
  brandInitial?: string;
}

export function LoginPageView({
  cedula,
  pin,
  onCedulaChange,
  onPinChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  demoCedula,
  demoPin,
  onUseDemo,
  brandName = import.meta.env.VITE_BRAND_NAME ?? DEFAULT_BRAND_NAME,
  brandLocation = import.meta.env.VITE_BRAND_LOCATION ?? DEFAULT_BRAND_LOCATION,
  brandInitial = import.meta.env.VITE_BRAND_INITIAL ?? DEFAULT_BRAND_INITIAL,
}: LoginPageViewProps): React.JSX.Element {
  return (
    <WebLoginPage
      brandName={brandName}
      brandLocation={brandLocation}
      brandInitial={brandInitial}
      cedula={cedula}
      pin={pin}
      onCedulaChange={onCedulaChange}
      onPinChange={onPinChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
      demoCredentials={{ cedula: demoCedula, pin: demoPin }}
      onUseDemo={
        onUseDemo ??
        (() => {
          onCedulaChange(demoCedula);
          onPinChange(demoPin);
        })
      }
    />
  );
}
