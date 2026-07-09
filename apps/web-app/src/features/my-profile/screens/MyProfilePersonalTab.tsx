import { PayrollEmployeePersonalDataTab } from '@/features/payroll/components/PayrollEmployeePersonalDataTab';
import { useTheme } from '@/providers/ThemeProvider';

import styles from './MyProfilePersonalTab.module.scss';

interface Props {
  userId: string | undefined;
}

export function MyProfilePersonalTab({ userId }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';

  if (!userId) {
    return <div className={styles.state}>No se pudo identificar su usuario.</div>;
  }

  return (
    <PayrollEmployeePersonalDataTab
      userId={userId}
      theme={empleadoTheme}
      showEmploymentSection={false}
    />
  );
}
