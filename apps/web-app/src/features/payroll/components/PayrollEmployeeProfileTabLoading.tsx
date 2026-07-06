import { LoadingState } from '@restopsiq/ui';

interface PayrollEmployeeProfileTabLoadingProps {
  label?: string;
  theme?: 'light' | 'dark';
}

export function PayrollEmployeeProfileTabLoading({
  label = 'Cargando…',
  theme = 'light',
}: PayrollEmployeeProfileTabLoadingProps): React.JSX.Element {
  return <LoadingState message={label} theme={theme} layout="compact" />;
}
