import { EmpleadoPage, EmpleadoPageHeader, EmpleadoPageSection, LoadingState } from '@restopsiq/ui';
import { Outlet } from 'react-router-dom';

import { useTheme } from '@/providers/ThemeProvider';

import { useMyEmployee } from '../hooks/useMyEmployee';
import styles from './MyProfileScreen.module.scss';

import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';

export interface MyProfileOutletContext {
  userId: string | undefined;
  employeeId: string;
  contractType: EmployeeContractType | undefined;
}

export function MyProfileScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { userId, employeeId, employee, isLoading, isError, refetch } = useMyEmployee();

  if (isLoading) {
    return (
      <LoadingState
        message="Cargando mi perfil…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (isError || !employeeId) {
    return (
      <div className={styles.state}>
        <p>No se encontró un empleado vinculado a su usuario.</p>
        <button type="button" onClick={() => void refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const subtitle = employee
    ? `${employee.name} · ${employee.position} · ${employee.location?.name ?? 'Sede'}`
    : 'Autoservicio del colaborador';

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} variant="header" divider>
        <EmpleadoPageHeader title="Mi perfil" subtitle={subtitle} theme={empleadoTheme} />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        <div className={styles.content}>
          <Outlet
            context={
              {
                userId,
                employeeId,
                contractType: employee?.contractType,
              } satisfies MyProfileOutletContext
            }
          />
        </div>
      </EmpleadoPageSection>
    </EmpleadoPage>
  );
}
