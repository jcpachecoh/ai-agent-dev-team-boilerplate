import { WebLoginPage } from '@restopsiq/ui';

const DEFAULT_BRAND_NAME = 'COMMAND CENTER';
const DEFAULT_BRAND_LOCATION = 'PLATFORM · RESTOPSIQ ENTERPRISE';
const DEFAULT_BRAND_INITIAL = 'R';

// Professional kitchen — Unsplash (free to use, no attribution required for product use)
// Photo by Elevate on Unsplash: https://unsplash.com/photos/jSZ_RbNRpjs
const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80&auto=format&fit=crop';

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
      heroImageUrl={HERO_IMAGE_URL}
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
