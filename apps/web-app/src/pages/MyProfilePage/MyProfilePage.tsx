import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';

import { PayrollEmployeeBankAccountsTab } from '@/features/payroll/components/PayrollEmployeeBankAccountsTab';
import { PayrollEmployeeDocumentsTab } from '@/features/payroll/components/PayrollEmployeeDocumentsTab';
import { PayrollEmployeeSocialSecurityTab } from '@/features/payroll/components/PayrollEmployeeSocialSecurityTab';
import type { MyProfileOutletContext } from '@/features/my-profile/screens/MyProfileScreen';
import { MyProfileScreen } from '@/features/my-profile/screens/MyProfileScreen';
import { MyProfilePersonalTab } from '@/features/my-profile/screens/MyProfilePersonalTab';
import { MyProfileVacationsTab } from '@/features/my-profile/screens/MyProfileVacationsTab';
import { useTheme } from '@/providers/ThemeProvider';

function useMyProfileTheme(): 'light' | 'dark' {
  const { theme } = useTheme();
  return theme === 'light' ? 'light' : 'dark';
}

function MyProfilePersonalRoute(): React.JSX.Element {
  const { userId } = useOutletContext<MyProfileOutletContext>();
  return <MyProfilePersonalTab userId={userId} />;
}

function MyProfileVacationsRoute(): React.JSX.Element {
  const { employeeId, contractType } = useOutletContext<MyProfileOutletContext>();
  return <MyProfileVacationsTab employeeId={employeeId} contractType={contractType} />;
}

function MyProfileSocialSecurityRoute(): React.JSX.Element {
  const { userId } = useOutletContext<MyProfileOutletContext>();
  const theme = useMyProfileTheme();

  if (!userId) {
    return <p>No se pudo identificar su usuario.</p>;
  }

  return <PayrollEmployeeSocialSecurityTab userId={userId} theme={theme} />;
}

function MyProfileBankAccountsRoute(): React.JSX.Element {
  const { userId } = useOutletContext<MyProfileOutletContext>();
  const theme = useMyProfileTheme();

  if (!userId) {
    return <p>No se pudo identificar su usuario.</p>;
  }

  return <PayrollEmployeeBankAccountsTab userId={userId} theme={theme} />;
}

function MyProfileDocumentsRoute(): React.JSX.Element {
  const { userId } = useOutletContext<MyProfileOutletContext>();
  const theme = useMyProfileTheme();

  if (!userId) {
    return <p>No se pudo identificar su usuario.</p>;
  }

  return <PayrollEmployeeDocumentsTab userId={userId} theme={theme} />;
}

export default function MyProfilePage(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<MyProfileScreen />}>
        <Route index element={<Navigate to="informacion-personal" replace />} />
        <Route path="informacion-personal" element={<MyProfilePersonalRoute />} />
        <Route path="vacaciones" element={<MyProfileVacationsRoute />} />
        <Route path="seguridad-social" element={<MyProfileSocialSecurityRoute />} />
        <Route path="bancos" element={<MyProfileBankAccountsRoute />} />
        <Route path="documentos" element={<MyProfileDocumentsRoute />} />
        <Route path="*" element={<Navigate to="informacion-personal" replace />} />
      </Route>
    </Routes>
  );
}
