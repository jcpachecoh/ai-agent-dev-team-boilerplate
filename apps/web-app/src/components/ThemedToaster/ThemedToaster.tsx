import { Toaster } from '@restopsiq/ui';

import { useUiTheme } from '@/hooks/useUiTheme';

export function ThemedToaster(): React.JSX.Element {
  const theme = useUiTheme();
  return <Toaster theme={theme} />;
}
