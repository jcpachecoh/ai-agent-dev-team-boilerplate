import { LoadingState } from '@restopsiq/ui';

import { useTheme } from '@/providers/ThemeProvider';

import { MyDotacionTable } from '../components/MyDotacionTable';
import { useMyDotacion } from '../hooks/useMyDotacion';
import styles from './MyProfileDotacionTab.module.scss';

interface Props {
  employeeId: string | undefined;
}

export function MyProfileDotacionTab({ employeeId }: Props): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const dotacionQuery = useMyDotacion(employeeId);

  if (dotacionQuery.isLoading) {
    return (
      <LoadingState
        message="Cargando dotación…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (dotacionQuery.isError) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar su historial de dotación.</p>
        <button type="button" onClick={() => void dotacionQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return <MyDotacionTable deliveries={dotacionQuery.data?.edges ?? []} theme={empleadoTheme} />;
}
