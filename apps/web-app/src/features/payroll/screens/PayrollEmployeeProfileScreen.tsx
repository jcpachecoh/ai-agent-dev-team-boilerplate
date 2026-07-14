import {
  EmpleadoAvatar,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  EmpleadoProfileTabBar,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
} from '@restopsiq/ui';
import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';

import { PayrollEmployeeDataConsentTab } from '../components/PayrollEmployeeDataConsentTab';
import { PayrollEmployeeDotacionesTab } from '../components/PayrollEmployeeDotacionesTab';
import { PayrollEmployeeDocumentsTab } from '../components/PayrollEmployeeDocumentsTab';
import { PayrollEmployeeAttendanceTab } from '../components/PayrollEmployeeAttendanceTab';
import { PayrollEmployeeBankAccountsTab } from '../components/PayrollEmployeeBankAccountsTab';
import { PayrollEmployeePaymentsTab } from '../components/PayrollEmployeePaymentsTab';
import { PayrollEmployeePersonalDataTab } from '../components/PayrollEmployeePersonalDataTab';
import { PayrollEmployeeProfilePlaceholderTab } from '../components/PayrollEmployeeProfilePlaceholderTab';
import { PayrollEmployeeSocialSecurityTab } from '../components/PayrollEmployeeSocialSecurityTab';
import { PayrollEmployeeTaxTab } from '../components/PayrollEmployeeTaxTab';
import {
  PAYROLL_EMPLOYEE_PROFILE_TABS,
  getPayrollEmployeeProfileTabDefinition,
  parsePayrollEmployeeProfileTab,
  type PayrollEmployeeProfileTabId,
} from '../constants/employee-profile-tabs';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import { PayrollEmployeeProfileTabLoading } from '../components/PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeProfileScreen.module.scss';

export function PayrollEmployeeProfileScreen(): React.JSX.Element {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const employeeQuery = usePayrollEmployeeQuery(userId);

  const activeTab = parsePayrollEmployeeProfileTab(searchParams.get('tab'));
  const activeTabDefinition = getPayrollEmployeeProfileTabDefinition(activeTab);

  const tabItems = useMemo(
    () =>
      PAYROLL_EMPLOYEE_PROFILE_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
      })),
    [],
  );

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const employee = employeeQuery.data;
  const title = employee?.name ?? 'Perfil de empleado';
  const subtitle = employee
    ? `${employee.position} · ${employee.area}`
    : 'Consulta centralizada del colaborador';

  const headerIcon = employee ? (
    <EmpleadoAvatar
      initials={resolveEmpleadoInitials(employee.name)}
      tone={resolveEmpleadoAvatarTone(employee.userId)}
      theme={empleadoTheme}
      size="md"
    />
  ) : undefined;

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <div className={styles.headerBlock}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/payroll/employees')}
          >
            <ArrowLeft size={14} aria-hidden />
            Volver a empleados
          </button>
          <EmpleadoPageHeader
            title={title}
            subtitle={subtitle}
            icon={headerIcon}
            theme={empleadoTheme}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        <div className={styles.profilePanel}>
          <EmpleadoProfileTabBar
            tabs={tabItems}
            activeTabId={activeTab}
            onTabChange={handleTabChange}
            theme={empleadoTheme}
          />

          <div className={styles.profileBody}>
            {employeeQuery.isLoading ? <PayrollEmployeeProfileTabLoading /> : null}

            {employeeQuery.isError ? (
              <div className={styles.state}>
                <p>No se pudo cargar el perfil del colaborador.</p>
                <button type="button" onClick={() => void employeeQuery.refetch()}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {!employeeQuery.isLoading && !employeeQuery.isError ? (
              <ProfileTabPanel
                userId={userId}
                tabId={activeTab}
                definition={activeTabDefinition}
                theme={empleadoTheme}
              />
            ) : null}
          </div>
        </div>
      </EmpleadoPageSection>
    </EmpleadoPage>
  );
}

function ProfileTabPanel({
  userId,
  tabId,
  definition,
  theme,
}: {
  userId: string;
  tabId: PayrollEmployeeProfileTabId;
  definition: ReturnType<typeof getPayrollEmployeeProfileTabDefinition>;
  theme: 'light' | 'dark';
}): React.JSX.Element {
  if (tabId === 'personal') {
    return <PayrollEmployeePersonalDataTab userId={userId} theme={theme} />;
  }

  if (tabId === 'social-security') {
    return <PayrollEmployeeSocialSecurityTab userId={userId} theme={theme} />;
  }

  if (tabId === 'attendance') {
    return <PayrollEmployeeAttendanceTab userId={userId} theme={theme} />;
  }

  if (tabId === 'bank-accounts') {
    return <PayrollEmployeeBankAccountsTab userId={userId} theme={theme} />;
  }

  if (tabId === 'payments') {
    return <PayrollEmployeePaymentsTab userId={userId} theme={theme} />;
  }

  if (tabId === 'taxes') {
    return <PayrollEmployeeTaxTab userId={userId} theme={theme} readOnly />;
  }

  if (tabId === 'documents') {
    return <PayrollEmployeeDocumentsTab userId={userId} theme={theme} />;
  }

  if (tabId === 'dotaciones') {
    return <PayrollEmployeeDotacionesTab userId={userId} theme={theme} />;
  }

  if (tabId === 'data-consent') {
    return <PayrollEmployeeDataConsentTab userId={userId} theme={theme} />;
  }

  return (
    <PayrollEmployeeProfilePlaceholderTab
      key={tabId}
      title={definition.placeholderTitle}
      description={definition.placeholderDescription}
    />
  );
}
